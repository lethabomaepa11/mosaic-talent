using Microsoft.EntityFrameworkCore;
using MosaicTalent.Domains.Projects;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperProjectService;

public partial class DeveloperProjectAppService
{
    private async Task<List<ProjectTaskDraft>> TryGenerateTasksWithAi(
        Project project,
        Dictionary<Guid, List<string>> memberSkillMap,
        List<ProjectTaskDraft> existingTasks,
        string repoAnalysisSummary)
    {
        if (!_groqChatService.IsConfigured())
        {
            return new List<ProjectTaskDraft>();
        }

        var memberDetails = await BuildMemberNameMap(memberSkillMap.Keys.ToList());
        var payload = new
        {
            project = new
            {
                title = project.Title,
                description = project.Description,
                difficulty = project.Difficulty.ToString(),
                skills = await _projectSkillRepository.GetAll()
                    .Where(x => x.ProjectId == project.Id)
                    .Select(x => x.Name)
                    .ToListAsync(),
            },
            repoAnalysisSummary = (repoAnalysisSummary ?? string.Empty).Trim(),
            existingTasks = (existingTasks ?? new List<ProjectTaskDraft>())
                .Take(40)
                .Select(x => new
                {
                    title = x.Title,
                    description = x.Description,
                    assignedMemberId = x.AssignedDeveloperId,
                }),
            members = memberSkillMap.Select(x => new
            {
                developerId = x.Key,
                name = memberDetails.TryGetValue(x.Key, out var name) ? name : "Member",
                skills = x.Value,
            }),
        };

        var systemPrompt =
            "Create 4-8 actionable project tasks using project specification and repository analysis context. " +
            "Return only JSON: {\"tasks\":[{\"title\":\"\",\"description\":\"\",\"assignedMemberId\":\"<guid>\"}]}. " +
            "Do not repeat or rephrase existing tasks. Keep titles specific and concise.";
        var response = await _groqChatService.TryCompleteAsync(systemPrompt, JsonSerializer.Serialize(payload));
        if (string.IsNullOrWhiteSpace(response))
        {
            return new List<ProjectTaskDraft>();
        }

        try
        {
            using var document = JsonDocument.Parse(response);
            var root = document.RootElement;
            var tasksElement = root.ValueKind == JsonValueKind.Array
                ? root
                : root.TryGetProperty("tasks", out var nested) ? nested : default;
            if (tasksElement.ValueKind != JsonValueKind.Array)
            {
                return new List<ProjectTaskDraft>();
            }

            var items = new List<ProjectTaskDraft>();
            foreach (var item in tasksElement.EnumerateArray())
            {
                var title = item.TryGetProperty("title", out var titleElement)
                    ? titleElement.GetString()
                    : string.Empty;
                if (string.IsNullOrWhiteSpace(title))
                {
                    continue;
                }

                var description = item.TryGetProperty("description", out var descElement)
                    ? descElement.GetString()
                    : string.Empty;
                var assignedRaw = item.TryGetProperty("assignedMemberId", out var assignedElement)
                    ? assignedElement.GetString()
                    : string.Empty;
                Guid? assigned = null;
                if (Guid.TryParse(assignedRaw, out var parsedAssigned) &&
                    memberSkillMap.ContainsKey(parsedAssigned))
                {
                    assigned = parsedAssigned;
                }
                else
                {
                    assigned = SelectBestAssignee($"{title} {description}", memberSkillMap);
                }

                items.Add(new ProjectTaskDraft
                {
                    Title = title.Trim(),
                    Description = (description ?? string.Empty).Trim(),
                    AssignedDeveloperId = assigned,
                });
            }

            return items;
        }
        catch
        {
            return new List<ProjectTaskDraft>();
        }
    }

    private static List<ProjectTaskDraft> BuildFallbackTasks(
        Project project,
        Dictionary<Guid, List<string>> memberSkillMap,
        List<ProjectTaskDraft> existingTasks)
    {
        var fallbacks = new List<ProjectTaskDraft>
        {
            new() { Title = "Define architecture and milestones", Description = "Break the project into delivery milestones and architecture decisions." },
            new() { Title = "Implement core user flow", Description = "Build the main flow and validate acceptance criteria with the team." },
            new() { Title = "Add tests and edge-case handling", Description = "Cover expected and failure scenarios with targeted tests." },
            new() { Title = "Prepare demo and documentation", Description = "Document setup, tradeoffs, and demo instructions for reviewers." },
        };

        foreach (var task in fallbacks)
        {
            task.AssignedDeveloperId = SelectBestAssignee($"{task.Title} {task.Description} {project.Title}", memberSkillMap);
        }

        return DeduplicateTaskDrafts(fallbacks, existingTasks);
    }

    private static List<ProjectTaskDraft> DeduplicateTaskDrafts(
        List<ProjectTaskDraft> candidates,
        List<ProjectTaskDraft> existingTasks)
    {
        var seen = BuildTaskFingerprintSet(existingTasks);
        var deduplicated = new List<ProjectTaskDraft>();
        foreach (var task in candidates ?? new List<ProjectTaskDraft>())
        {
            var title = (task?.Title ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(title))
            {
                continue;
            }

            var description = (task?.Description ?? string.Empty).Trim();
            var fingerprint = BuildTaskFingerprint(title, description);
            if (string.IsNullOrWhiteSpace(fingerprint) || seen.Contains(fingerprint))
            {
                continue;
            }

            seen.Add(fingerprint);
            deduplicated.Add(new ProjectTaskDraft
            {
                Title = title,
                Description = description,
                AssignedDeveloperId = task?.AssignedDeveloperId,
            });
        }

        return deduplicated;
    }

    private static HashSet<string> BuildTaskFingerprintSet(List<ProjectTaskDraft> tasks)
    {
        var fingerprints = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var task in tasks ?? new List<ProjectTaskDraft>())
        {
            var fingerprint = BuildTaskFingerprint(task?.Title, task?.Description);
            if (!string.IsNullOrWhiteSpace(fingerprint))
            {
                fingerprints.Add(fingerprint);
            }
        }

        return fingerprints;
    }

    private static string BuildTaskFingerprint(string title, string description)
    {
        var normalizedTitle = NormalizeTaskText(title);
        if (string.IsNullOrWhiteSpace(normalizedTitle))
        {
            return string.Empty;
        }

        var normalizedDescription = NormalizeTaskText(description);
        return string.IsNullOrWhiteSpace(normalizedDescription)
            ? normalizedTitle
            : $"{normalizedTitle}::{normalizedDescription}";
    }

    private static string NormalizeTaskText(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return string.Empty;
        }

        var collapsed = string.Join(
            " ",
            input.Trim()
                .Split(new[] { ' ', '\t', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries));
        return collapsed.ToLowerInvariant();
    }

    private static Guid? SelectBestAssignee(string taskText, Dictionary<Guid, List<string>> memberSkillMap)
    {
        if (memberSkillMap.Count == 0)
        {
            return null;
        }

        var normalized = (taskText ?? string.Empty).ToLowerInvariant();
        var best = memberSkillMap
            .Select(x => new
            {
                x.Key,
                Score = x.Value.Count(skill =>
                    normalized.Contains((skill ?? string.Empty).Trim().ToLowerInvariant())),
            })
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.Key)
            .FirstOrDefault();

        return best?.Key ?? memberSkillMap.Keys.FirstOrDefault();
    }

    private sealed class ProjectTaskDraft
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public Guid? AssignedDeveloperId { get; set; }
    }
}
