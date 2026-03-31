using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Services.DeveloperOnboardingService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperOnboardingService;

public partial class DeveloperOnboardingAppService
{
    public async Task<DeveloperLearningPathResultDto> GetMyLearningPathRecommendations()
    {
        var context = await BuildLearningPathContext();
        var fallback = BuildFallbackLearningPath(context);

        if (!_groqChatService.IsConfigured())
        {
            return fallback;
        }

        var aiResult = await TryGenerateLearningPathWithAi(context, fallback);
        return aiResult ?? fallback;
    }

    private async Task<LearningPathContext> BuildLearningPathContext()
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");

        var developer = await _developerRepository.GetAll()
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (developer == null)
        {
            return new LearningPathContext();
        }

        var profile = await _profileRepository.GetAll()
            .FirstOrDefaultAsync(x => x.DeveloperId == developer.Id);

        var skills = profile == null
            ? new List<string>()
            : await _profileSkillRepository.GetAll()
                .Where(x => x.ProfileId == profile.Id)
                .Select(x => x.Name)
                .ToListAsync();

        var goals = profile == null
            ? new List<string>()
            : await _profileGoalRepository.GetAll()
                .Where(x => x.ProfileId == profile.Id)
                .Select(x => x.Goal)
                .ToListAsync();

        return new LearningPathContext
        {
            Skills = NormalizeTextValues(skills),
            Goals = NormalizeTextValues(goals),
            YearsOfExperience = developer.YearsOfExperience,
            YearOfStudy = developer.YearOfStudy,
            StudyLevel = developer.StudyLevel.ToString(),
        };
    }

    private async Task<DeveloperLearningPathResultDto> TryGenerateLearningPathWithAi(
        LearningPathContext context,
        DeveloperLearningPathResultDto fallback)
    {
        var tracks = ResolveMarketTracks(context.Goals);
        var payload = new
        {
            profile = new
            {
                yearsOfExperience = context.YearsOfExperience,
                yearOfStudy = context.YearOfStudy,
                studyLevel = context.StudyLevel,
                skills = context.Skills,
                goals = context.Goals,
            },
            marketRequirements = tracks.Select(track => new
            {
                role = track.Role,
                requiredSkills = track.RequiredSkills,
                supportingSkills = track.SupportingSkills,
            }).ToList(),
        };

        var systemPrompt =
            "You are a software career growth advisor. " +
            "Return only JSON with fields: summary (string), recommendations (array). " +
            "Each recommendations item must contain: goal (string), priority (high|medium|low), estimatedWeeks (integer 2-26), gapSummary (string), recommendedSkills (string array), suggestedActions (string array). " +
            "Recommendations must map current profile to next-step market requirements. Keep advice actionable.";

        var response = await _groqChatService.TryCompleteAsync(systemPrompt, JsonSerializer.Serialize(payload));
        if (string.IsNullOrWhiteSpace(response))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(response);
            var root = document.RootElement;

            var summary = root.TryGetProperty("summary", out var summaryNode)
                ? (summaryNode.GetString() ?? string.Empty).Trim()
                : fallback.Summary;

            var recommendations = new List<DeveloperLearningPathRecommendationDto>();
            if (root.TryGetProperty("recommendations", out var recommendationsNode) &&
                recommendationsNode.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in recommendationsNode.EnumerateArray().Take(4))
                {
                    var goal = item.TryGetProperty("goal", out var goalNode)
                        ? (goalNode.GetString() ?? string.Empty).Trim()
                        : string.Empty;

                    var priority = item.TryGetProperty("priority", out var priorityNode)
                        ? (priorityNode.GetString() ?? "medium").Trim().ToLowerInvariant()
                        : "medium";

                    var estimatedWeeks = item.TryGetProperty("estimatedWeeks", out var weeksNode) &&
                        weeksNode.TryGetInt32(out var parsedWeeks)
                        ? Math.Clamp(parsedWeeks, 2, 26)
                        : 6;

                    var gapSummary = item.TryGetProperty("gapSummary", out var gapNode)
                        ? (gapNode.GetString() ?? string.Empty).Trim()
                        : string.Empty;

                    var recommendedSkills = item.TryGetProperty("recommendedSkills", out var skillsNode)
                        ? ReadStringArray(skillsNode)
                        : new List<string>();

                    var suggestedActions = item.TryGetProperty("suggestedActions", out var actionsNode)
                        ? ReadStringArray(actionsNode)
                        : new List<string>();

                    if (string.IsNullOrWhiteSpace(goal) || suggestedActions.Count == 0)
                    {
                        continue;
                    }

                    recommendations.Add(new DeveloperLearningPathRecommendationDto
                    {
                        Goal = goal,
                        Priority = NormalizePriority(priority),
                        EstimatedWeeks = estimatedWeeks,
                        GapSummary = string.IsNullOrWhiteSpace(gapSummary)
                            ? "Close the identified skill gap with practical delivery work."
                            : gapSummary,
                        RecommendedSkills = NormalizeTextValues(recommendedSkills).Take(5).ToList(),
                        SuggestedActions = NormalizeTextValues(suggestedActions).Take(5).ToList(),
                    });
                }
            }

            if (recommendations.Count == 0)
            {
                return null;
            }

            return new DeveloperLearningPathResultDto
            {
                Source = "ai",
                Summary = string.IsNullOrWhiteSpace(summary) ? fallback.Summary : summary,
                MarketSignals = fallback.MarketSignals,
                Recommendations = recommendations,
            };
        }
        catch
        {
            return null;
        }
    }

    private static DeveloperLearningPathResultDto BuildFallbackLearningPath(LearningPathContext context)
    {
        var tracks = ResolveMarketTracks(context.Goals);
        var normalizedSkills = context.Skills
            .Select(NormalizeSkillToken)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var recommendations = new List<DeveloperLearningPathRecommendationDto>();
        var orderedGoals = context.Goals.Count == 0
            ? new List<string> { $"Grow toward {tracks[0].Role}", $"Advance in {tracks[1].Role}" }
            : context.Goals;

        for (var index = 0; index < Math.Min(3, tracks.Count); index++)
        {
            var track = tracks[index];
            var missingSkills = track.RequiredSkills
                .Where(skill => !normalizedSkills.Contains(NormalizeSkillToken(skill)))
                .Take(5)
                .ToList();

            var recommendedSkills = missingSkills.Count > 0
                ? missingSkills
                : track.SupportingSkills.Take(3).ToList();

            var estimatedWeeks = Math.Clamp(4 + (recommendedSkills.Count * 2), 4, 20);
            var goal = orderedGoals[index % orderedGoals.Count];
            var roleTarget = track.Role;

            recommendations.Add(new DeveloperLearningPathRecommendationDto
            {
                Goal = goal,
                Priority = index == 0 ? "high" : "medium",
                EstimatedWeeks = estimatedWeeks,
                GapSummary = recommendedSkills.Count > 0
                    ? $"To move toward {roleTarget}, strengthen {string.Join(", ", recommendedSkills.Take(3))}."
                    : $"Build deeper project evidence for {roleTarget}.",
                RecommendedSkills = recommendedSkills,
                SuggestedActions = BuildFallbackActions(roleTarget, recommendedSkills),
            });
        }

        return new DeveloperLearningPathResultDto
        {
            Source = "fallback",
            Summary = BuildFallbackSummary(context, tracks),
            MarketSignals = tracks
                .Take(3)
                .Select(track => $"{track.Role}: {string.Join(", ", track.RequiredSkills.Take(4))}")
                .ToList(),
            Recommendations = recommendations,
        };
    }

    private static string BuildFallbackSummary(LearningPathContext context, List<MarketTrack> tracks)
    {
        var skillsText = context.Skills.Count == 0 ? "no declared skills yet" : $"{context.Skills.Count} declared skills";
        var goalsText = context.Goals.Count == 0 ? "no explicit goals yet" : $"{context.Goals.Count} learning goals";
        var topRole = tracks.FirstOrDefault()?.Role ?? "Software Engineer";
        return $"Personalized path generated from {skillsText} and {goalsText}, aligned to {topRole} market requirements.";
    }

    private static List<string> BuildFallbackActions(string roleTarget, List<string> recommendedSkills)
    {
        var actions = new List<string>
        {
            $"Ship one portfolio project feature aligned to {roleTarget} responsibilities.",
            "Write a short retrospective outlining design choices, tradeoffs, and results.",
        };

        actions.AddRange(recommendedSkills
            .Take(2)
            .Select(skill => $"Complete one focused practice sprint for {skill} and publish the outcome."));

        return actions.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static List<MarketTrack> ResolveMarketTracks(List<string> goals)
    {
        var allTracks = BuildMarketTracks();
        var normalizedGoals = goals.Select(x => x.ToLowerInvariant()).ToList();

        var ranked = allTracks
            .Select(track => new
            {
                track,
                score = normalizedGoals.Count(goal =>
                    goal.Contains(track.Keyword, StringComparison.OrdinalIgnoreCase) ||
                    track.RequiredSkills.Any(skill => goal.Contains(skill, StringComparison.OrdinalIgnoreCase))),
            })
            .OrderByDescending(item => item.score)
            .ThenBy(item => item.track.Role)
            .Select(item => item.track)
            .ToList();

        if (ranked.All(track => !normalizedGoals.Any(goal => goal.Contains(track.Keyword, StringComparison.OrdinalIgnoreCase))))
        {
            return allTracks.Take(3).ToList();
        }

        return ranked.Take(3).ToList();
    }

    private static List<MarketTrack> BuildMarketTracks()
    {
        return new List<MarketTrack>
        {
            new("Full-Stack Engineer", "fullstack",
                new List<string> { "TypeScript", "React", "API Design", "SQL", "Testing" },
                new List<string> { "Docker", "CI/CD", "System Design" }),
            new("Backend Engineer", "backend",
                new List<string> { ".NET", "API Design", "PostgreSQL", "Testing", "Cloud Basics" },
                new List<string> { "Distributed Systems", "Caching", "Observability" }),
            new("Frontend Engineer", "frontend",
                new List<string> { "TypeScript", "React", "Accessibility", "Performance", "Testing" },
                new List<string> { "Design Systems", "State Management", "Animation" }),
            new("DevOps Engineer", "devops",
                new List<string> { "Docker", "CI/CD", "Cloud Basics", "Monitoring", "Security Fundamentals" },
                new List<string> { "Kubernetes", "Infrastructure as Code", "Cost Optimization" }),
            new("AI Engineer", "ai",
                new List<string> { "Python", "LLM Prompting", "Evaluation", "APIs", "Data Handling" },
                new List<string> { "RAG", "Vector Databases", "Model Fine-Tuning" }),
        };
    }

    private static List<string> ReadStringArray(JsonElement node)
    {
        if (node.ValueKind != JsonValueKind.Array)
        {
            return new List<string>();
        }

        return node.EnumerateArray()
            .Where(item => item.ValueKind == JsonValueKind.String)
            .Select(item => item.GetString())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static List<string> NormalizeTextValues(IEnumerable<string> values)
    {
        return (values ?? Array.Empty<string>())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string NormalizePriority(string value)
    {
        return value switch
        {
            "high" => "high",
            "low" => "low",
            _ => "medium",
        };
    }

    private static string NormalizeSkillToken(string value)
    {
        var token = (value ?? string.Empty).Trim().ToLowerInvariant();
        return token switch
        {
            "c#" => ".net",
            "asp.net" => ".net",
            "node" => "node.js",
            "nodejs" => "node.js",
            "ts" => "typescript",
            "js" => "javascript",
            _ => token,
        };
    }

    private class LearningPathContext
    {
        public int? YearsOfExperience { get; set; }
        public int? YearOfStudy { get; set; }
        public string StudyLevel { get; set; } = string.Empty;
        public List<string> Skills { get; set; } = new();
        public List<string> Goals { get; set; } = new();
    }

    private class MarketTrack
    {
        public MarketTrack(string role, string keyword, List<string> requiredSkills, List<string> supportingSkills)
        {
            Role = role;
            Keyword = keyword;
            RequiredSkills = requiredSkills;
            SupportingSkills = supportingSkills;
        }

        public string Role { get; }
        public string Keyword { get; }
        public List<string> RequiredSkills { get; }
        public List<string> SupportingSkills { get; }
    }
}
