using MosaicTalent.Services.DeveloperProjectService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MosaicTalent.Services.DeveloperProjectService;

public partial class DeveloperProjectAppService
{
    private static ProjectEffortEstimate ResolveProjectEffortEstimate(
        string prompt,
        string repoHint,
        AiProjectSpecDraft draft,
        string aiDifficultyRaw,
        int aiHoursRaw,
        AiGeneratedProjectSpecDto fallback)
    {
        var heuristic = BuildHeuristicEffortEstimate(prompt, repoHint, draft);
        var aiDifficulty = NormalizeDifficultyLabel(aiDifficultyRaw);
        var aiHours = Math.Clamp(aiHoursRaw, 1, 40);
        var hasAiDifficulty = !string.IsNullOrWhiteSpace((aiDifficultyRaw ?? string.Empty).Trim());
        var hasAiHours = aiHoursRaw > 0;

        if (!hasAiDifficulty && !hasAiHours)
        {
            return heuristic;
        }

        var looksGenericDefault = aiDifficulty == "intermediate" && aiHours == 20;
        if (looksGenericDefault)
        {
            return heuristic;
        }

        var resolvedDifficulty = hasAiDifficulty ? aiDifficulty : heuristic.Difficulty;
        var resolvedHours = hasAiHours ? aiHours : heuristic.Hours;

        if (DifficultyDistance(resolvedDifficulty, heuristic.Difficulty) >= 2)
        {
            resolvedDifficulty = heuristic.Difficulty;
        }

        if (Math.Abs(resolvedHours - heuristic.Hours) >= 12)
        {
            resolvedHours = (int)Math.Round((resolvedHours + heuristic.Hours) / 2.0, MidpointRounding.AwayFromZero);
        }

        var hourRange = ResolveHoursRangeForDifficulty(resolvedDifficulty);
        resolvedHours = Math.Clamp(resolvedHours, hourRange.Min, hourRange.Max);

        if (string.IsNullOrWhiteSpace(resolvedDifficulty))
        {
            resolvedDifficulty = NormalizeDifficultyLabel(fallback.Difficulty);
        }

        if (resolvedHours <= 0)
        {
            resolvedHours = Math.Clamp(fallback.EstimatedHoursPerWeek, hourRange.Min, hourRange.Max);
        }

        return new ProjectEffortEstimate(resolvedDifficulty, resolvedHours);
    }

    private static ProjectEffortEstimate BuildHeuristicEffortEstimate(
        string prompt,
        string repoHint,
        AiProjectSpecDraft draft)
    {
        var analysisText = string.Join(" ", new[]
        {
            prompt ?? string.Empty,
            repoHint ?? string.Empty,
            draft?.Title ?? string.Empty,
            draft?.Overview ?? string.Empty,
            draft?.ProblemStatement ?? string.Empty,
            string.Join(" ", draft?.Goals ?? new List<string>()),
            string.Join(" ", draft?.FunctionalRequirements ?? new List<string>()),
            string.Join(" ", draft?.NonFunctionalRequirements ?? new List<string>()),
            string.Join(" ", draft?.TechnicalApproach ?? new List<string>()),
            string.Join(" ", draft?.Risks ?? new List<string>()),
        }).ToLowerInvariant();

        var complexityScore = 0;
        complexityScore += ScoreKeywordMatches(analysisText, BeginnerSignals, -2);
        complexityScore += ScoreKeywordMatches(analysisText, IntermediateSignals, 1);
        complexityScore += ScoreKeywordMatches(analysisText, AdvancedSignals, 2);
        complexityScore += ScoreKeywordMatches(analysisText, ExpertSignals, 3);

        complexityScore += Math.Min((draft?.FunctionalRequirements?.Count ?? 0), 10) / 2;
        complexityScore += Math.Min((draft?.NonFunctionalRequirements?.Count ?? 0), 8) / 4;
        complexityScore += Math.Min((draft?.Milestones?.Count ?? 0), 6) - 2;
        complexityScore = Math.Clamp(complexityScore, -6, 18);

        var difficulty = complexityScore switch
        {
            <= 0 => "beginner",
            <= 4 => "intermediate",
            <= 9 => "advanced",
            _ => "expert",
        };

        var hours = difficulty switch
        {
            "beginner" => 5 + Math.Max(0, complexityScore),
            "intermediate" => 8 + Math.Max(0, complexityScore - 1),
            "advanced" => 12 + Math.Max(0, complexityScore - 5),
            _ => 18 + Math.Max(0, complexityScore - 10),
        };

        var range = ResolveHoursRangeForDifficulty(difficulty);
        return new ProjectEffortEstimate(difficulty, Math.Clamp(hours, range.Min, range.Max));
    }

    private static int ScoreKeywordMatches(string analysisText, IReadOnlyCollection<string> keywords, int weight)
    {
        if (string.IsNullOrWhiteSpace(analysisText) || keywords.Count == 0)
        {
            return 0;
        }

        var matches = keywords.Count(keyword => analysisText.Contains(keyword, StringComparison.Ordinal));
        return matches * weight;
    }

    private static (int Min, int Max) ResolveHoursRangeForDifficulty(string difficulty)
    {
        return difficulty switch
        {
            "beginner" => (4, 10),
            "intermediate" => (8, 16),
            "advanced" => (12, 24),
            "expert" => (16, 32),
            _ => (6, 18),
        };
    }

    private static int DifficultyDistance(string left, string right)
    {
        return Math.Abs(ToDifficultyRank(left) - ToDifficultyRank(right));
    }

    private static int ToDifficultyRank(string difficulty)
    {
        return NormalizeDifficultyLabel(difficulty) switch
        {
            "beginner" => 0,
            "intermediate" => 1,
            "advanced" => 2,
            "expert" => 3,
            _ => 1,
        };
    }

    private sealed record ProjectEffortEstimate(string Difficulty, int Hours);

    private static readonly string[] BeginnerSignals =
    {
        "beginner",
        "starter",
        "simple",
        "basic",
        "intro",
        "tutorial",
        "learning project",
    };

    private static readonly string[] IntermediateSignals =
    {
        "dashboard",
        "crud",
        "api integration",
        "auth",
        "workflow",
        "team collaboration",
    };

    private static readonly string[] AdvancedSignals =
    {
        "real-time",
        "realtime",
        "websocket",
        "security",
        "oauth",
        "payment",
        "streaming",
        "microservice",
        "multi-tenant",
        "ci/cd",
    };

    private static readonly string[] ExpertSignals =
    {
        "distributed",
        "kubernetes",
        "event sourcing",
        "machine learning",
        "ml",
        "compiler",
        "high availability",
        "zero trust",
        "blockchain",
        "large-scale",
    };
}
