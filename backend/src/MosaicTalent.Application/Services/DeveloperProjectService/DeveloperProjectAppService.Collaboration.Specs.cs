using MosaicTalent.Services.DeveloperProjectService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Json;

namespace MosaicTalent.Services.DeveloperProjectService;

public partial class DeveloperProjectAppService
{
    private static string BuildProjectSpecSystemPrompt()
    {
        return "You are a staff engineer writing a project specification." +
               " Return only JSON with keys: title, difficulty, estimatedHoursPerWeek, difficultyReason, hoursReason," +
               " skills, overview, problemStatement," +
               " goals, nonGoals, targetUsers, functionalRequirements, nonFunctionalRequirements, technicalApproach," +
               " milestones, risks, acceptanceCriteria, definitionOfDone." +
               " Do not default to intermediate and 20 hours. Infer difficulty/hours from project scope and justify in reasons." +
               " Use arrays for list fields. milestones must be an array of objects with name, etaWeeks, deliverables.";
    }

    private static string BuildProjectSpecPromptPayload(string prompt, string repoHint)
    {
        var payload = new
        {
            userPrompt = prompt,
            repoHint,
            constraints = new
            {
                difficulty = "beginner|intermediate|advanced|expert",
                estimatedHoursPerWeek = "integer between 1 and 40",
                listLength = "3-8 items per list where possible",
                tone = "clear, concrete, implementation-ready",
            },
        };

        return JsonSerializer.Serialize(payload);
    }

    private static AiGeneratedProjectSpecDto ParseAiProjectSpecResponse(
        string response,
        string prompt,
        string repoHint,
        AiGeneratedProjectSpecDto fallback)
    {
        using var document = JsonDocument.Parse(response);
        var root = ResolveSpecRoot(document.RootElement);
        if (root.ValueKind != JsonValueKind.Object)
        {
            return fallback;
        }

        var aiDifficultyRaw = ReadString(root, "difficulty");
        var aiHoursRaw = ReadInt(root, "estimatedHoursPerWeek", fallback.EstimatedHoursPerWeek);

        var draft = new AiProjectSpecDraft
        {
            Title = ReadString(root, "title"),
            Difficulty = NormalizeDifficultyLabel(aiDifficultyRaw),
            EstimatedHoursPerWeek = Math.Clamp(aiHoursRaw, 1, 40),
            Skills = ReadStringArray(root, "skills", 8),
            Overview = ReadString(root, "overview"),
            ProblemStatement = ReadString(root, "problemStatement"),
            Goals = ReadStringArray(root, "goals", 8),
            NonGoals = ReadStringArray(root, "nonGoals", 8),
            TargetUsers = ReadStringArray(root, "targetUsers", 8),
            FunctionalRequirements = ReadStringArray(root, "functionalRequirements", 12),
            NonFunctionalRequirements = ReadStringArray(root, "nonFunctionalRequirements", 10),
            TechnicalApproach = ReadStringArray(root, "technicalApproach", 10),
            Milestones = ReadMilestones(root),
            Risks = ReadStringArray(root, "risks", 8),
            AcceptanceCriteria = ReadStringArray(root, "acceptanceCriteria", 10),
            DefinitionOfDone = ReadStringArray(root, "definitionOfDone", 10),
        };

        var title = string.IsNullOrWhiteSpace(draft.Title) ? fallback.Title : draft.Title.Trim();
        var skills = draft.Skills.Count == 0 ? fallback.Skills : draft.Skills;
        var effortEstimate = ResolveProjectEffortEstimate(
            prompt,
            repoHint,
            draft,
            aiDifficultyRaw,
            aiHoursRaw,
            fallback);
        var difficulty = effortEstimate.Difficulty;
        var hours = effortEstimate.Hours;

        return new AiGeneratedProjectSpecDto
        {
            Title = title,
            DescriptionMarkdown = BuildStructuredProjectSpecMarkdown(
                draft,
                prompt,
                repoHint,
                title,
                skills,
                difficulty,
                hours),
            Skills = skills,
            Difficulty = difficulty,
            EstimatedHoursPerWeek = hours,
        };
    }

    private static JsonElement ResolveSpecRoot(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Object)
        {
            return root;
        }

        if (root.TryGetProperty("result", out var result) && result.ValueKind == JsonValueKind.Object)
        {
            return result;
        }

        if (root.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object)
        {
            return data;
        }

        return root;
    }

    private static string BuildCreateGithubRepositoryErrorMessage(HttpStatusCode statusCode, string githubError)
    {
        var normalizedError = (githubError ?? string.Empty).Trim();
        if (statusCode == HttpStatusCode.Forbidden && IsRepositoryPermissionError(normalizedError))
        {
            return "GitHub denied repository creation for the current token. Reconnect GitHub and approve repository permissions, then retry.";
        }

        if (statusCode == HttpStatusCode.Unauthorized)
        {
            return "GitHub connection expired. Reconnect GitHub and try creating the repository again.";
        }

        return string.IsNullOrWhiteSpace(normalizedError)
            ? "Failed to create GitHub repository. Verify GitHub connection permissions and try again."
            : normalizedError;
    }

    private static bool IsRepositoryPermissionError(string githubError)
    {
        if (string.IsNullOrWhiteSpace(githubError))
        {
            return false;
        }

        var normalized = githubError.ToLowerInvariant();
        return normalized.Contains("resource not accessible by integration") ||
               normalized.Contains("insufficient") ||
               normalized.Contains("permission") ||
               normalized.Contains("scope");
    }

    private static AiGeneratedProjectSpecDto BuildFallbackProjectSpec(string prompt, string repoHint)
    {
        var titleSeed = string.IsNullOrWhiteSpace(prompt) ? repoHint : prompt;
        var normalizedTitle = string.IsNullOrWhiteSpace(titleSeed)
            ? "Collaborative Delivery Project"
            : titleSeed.Split('.', '!', '?').FirstOrDefault()?.Trim() ?? "Collaborative Delivery Project";
        if (normalizedTitle.Length > 70)
        {
            normalizedTitle = normalizedTitle.Substring(0, 70).Trim();
        }

        var title = normalizedTitle.Length < 10 ? $"{normalizedTitle} Build" : normalizedTitle;
        var defaultSkills = new List<string> { "Planning", "Collaboration", "Testing" };

        return new AiGeneratedProjectSpecDto
        {
            Title = title,
            DescriptionMarkdown = BuildStructuredProjectSpecMarkdown(
                new AiProjectSpecDraft(),
                prompt,
                repoHint,
                title,
                defaultSkills,
                "intermediate",
                6),
            Skills = defaultSkills,
            Difficulty = "intermediate",
            EstimatedHoursPerWeek = 6,
        };
    }

    private sealed class AiProjectSpecDraft
    {
        public string Title { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public int EstimatedHoursPerWeek { get; set; }
        public List<string> Skills { get; set; } = new();
        public string Overview { get; set; } = string.Empty;
        public string ProblemStatement { get; set; } = string.Empty;
        public List<string> Goals { get; set; } = new();
        public List<string> NonGoals { get; set; } = new();
        public List<string> TargetUsers { get; set; } = new();
        public List<string> FunctionalRequirements { get; set; } = new();
        public List<string> NonFunctionalRequirements { get; set; } = new();
        public List<string> TechnicalApproach { get; set; } = new();
        public List<AiProjectMilestone> Milestones { get; set; } = new();
        public List<string> Risks { get; set; } = new();
        public List<string> AcceptanceCriteria { get; set; } = new();
        public List<string> DefinitionOfDone { get; set; } = new();
    }

    private sealed class AiProjectMilestone
    {
        public string Name { get; set; } = string.Empty;
        public int EtaWeeks { get; set; }
        public List<string> Deliverables { get; set; } = new();
    }
}
