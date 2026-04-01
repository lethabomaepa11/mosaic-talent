using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.DeveloperProjectService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperProjectService;

public partial class DeveloperProjectAppService
{
    private async Task<ProjectJoinLoadWarningDto> BuildJoinLoadWarning(Guid developerId, Project candidateProject)
    {
        var memberships = await _projectMemberRepository.GetAll()
            .Where(x => x.DeveloperId == developerId)
            .ToListAsync();
        if (memberships.Count == 0)
        {
            var emptyScore = CalculateProjectWorkloadScore(candidateProject);
            return new ProjectJoinLoadWarningDto
            {
                ShouldWarn = emptyScore > RecommendedWorkloadScoreLimit,
                ActiveProjects = 0,
                RecommendedProjectLimit = RecommendedActiveProjectLimit,
                CurrentWorkloadScore = 0,
                ProposedWorkloadScore = emptyScore,
                RecommendedWorkloadLimit = RecommendedWorkloadScoreLimit,
                Message = "No active project overlap detected.",
            };
        }

        var projectIds = memberships.Select(x => x.ProjectId).Distinct().ToList();
        var activeProjects = await _projectRepository.GetAll()
            .Where(x => projectIds.Contains(x.Id) && x.Status != ProjectStatus.Complete)
            .ToListAsync();
        var activeCount = activeProjects.Count;
        var currentWorkload = activeProjects.Sum(CalculateProjectWorkloadScore);

        var alreadyActive = activeProjects.Any(x => x.Id == candidateProject.Id);
        var proposedCount = alreadyActive ? activeCount : activeCount + 1;
        var proposedWorkload = alreadyActive
            ? currentWorkload
            : currentWorkload + CalculateProjectWorkloadScore(candidateProject);

        var shouldWarn = proposedCount > RecommendedActiveProjectLimit ||
                         proposedWorkload > RecommendedWorkloadScoreLimit;
        return new ProjectJoinLoadWarningDto
        {
            ShouldWarn = shouldWarn,
            ActiveProjects = activeCount,
            RecommendedProjectLimit = RecommendedActiveProjectLimit,
            CurrentWorkloadScore = currentWorkload,
            ProposedWorkloadScore = proposedWorkload,
            RecommendedWorkloadLimit = RecommendedWorkloadScoreLimit,
            Message = shouldWarn
                ? $"You are about to run {proposedCount} active projects with workload score {proposedWorkload}. This may affect learning quality due to overlapping timelines."
                : "No active project overlap detected.",
        };
    }

    private async Task<Dictionary<Guid, List<string>>> BuildMemberSkillMap(List<Guid> memberIds)
    {
        var profiles = await _developerProfileRepository.GetAll()
            .Where(x => memberIds.Contains(x.DeveloperId))
            .ToListAsync();
        var profileIds = profiles.Select(x => x.Id).ToList();
        var profileSkills = await _developerProfileSkillRepository.GetAll()
            .Where(x => profileIds.Contains(x.ProfileId))
            .ToListAsync();

        var map = new Dictionary<Guid, List<string>>();
        foreach (var memberId in memberIds)
        {
            var profile = profiles.FirstOrDefault(x => x.DeveloperId == memberId);
            var skills = profile == null
                ? new List<string>()
                : profileSkills
                    .Where(x => x.ProfileId == profile.Id)
                    .Select(x => x.Name)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
            map[memberId] = skills;
        }

        return map;
    }

    private async Task<List<ProjectTaskDraft>> TryGenerateTasksWithAi(
        Project project,
        Dictionary<Guid, List<string>> memberSkillMap)
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
            members = memberSkillMap.Select(x => new
            {
                developerId = x.Key,
                name = memberDetails.TryGetValue(x.Key, out var name) ? name : "Member",
                skills = x.Value,
            }),
        };

        var systemPrompt =
            "Create 4-8 actionable project tasks. Return only JSON: {\"tasks\":[{\"title\":\"\",\"description\":\"\",\"assignedMemberId\":\"<guid>\"}]}.";
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
        Dictionary<Guid, List<string>> memberSkillMap)
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

        return fallbacks;
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

    private async Task<string> ResolveDeveloperDisplayName(Guid developerId)
    {
        var developer = await _developerRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == developerId);
        if (developer == null)
        {
            return string.Empty;
        }

        var user = await _userRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == developer.UserId);
        var fullName = string.Join(" ", new[] { user?.Name, user?.Surname }
            .Where(x => !string.IsNullOrWhiteSpace(x)));
        return string.IsNullOrWhiteSpace(fullName)
            ? user?.UserName ?? "Developer"
            : fullName;
    }

    private static int CalculateProjectWorkloadScore(Project project)
    {
        var hours = Math.Clamp(project?.EstimatedHoursPerWeek ?? 6, 1, 40);
        var difficultyMultiplier = project?.Difficulty switch
        {
            ProjectDifficulty.Beginner => 1.0,
            ProjectDifficulty.Intermediate => 1.35,
            ProjectDifficulty.Advanced => 1.75,
            ProjectDifficulty.Expert => 2.2,
            _ => 1.35,
        };

        return (int)Math.Round(hours * difficultyMultiplier * 10, MidpointRounding.AwayFromZero);
    }

    private sealed class ProjectTaskDraft
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public Guid? AssignedDeveloperId { get; set; }
    }
}
