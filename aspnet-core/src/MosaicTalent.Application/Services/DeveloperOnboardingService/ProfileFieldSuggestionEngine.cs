using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace MosaicTalent.Services.DeveloperOnboardingService;

public static class ProfileFieldSuggestionEngine
{
    public static List<string> BuildFallbackSuggestions(
        string field,
        string query,
        IEnumerable<string> existingValues,
        IEnumerable<string> currentSkills,
        IEnumerable<string> currentGoals,
        IReadOnlyCollection<SuggestionTrack> tracks,
        int maxResults)
    {
        var normalizedField = NormalizeField(field);
        var effectiveMax = Math.Clamp(maxResults, 1, 12);
        var candidates = normalizedField == "goal"
            ? BuildGoalCandidates(currentGoals, tracks)
            : BuildSkillCandidates(currentSkills, tracks);

        return ApplySuggestionConstraints(
            candidates,
            normalizedField,
            query,
            existingValues,
            effectiveMax);
    }

    public static List<string> ParseAiSuggestions(string response)
    {
        if (string.IsNullOrWhiteSpace(response))
        {
            return new List<string>();
        }

        try
        {
            using var document = JsonDocument.Parse(response);
            var root = document.RootElement;

            if (root.ValueKind == JsonValueKind.Array)
            {
                return ReadStringArray(root);
            }

            if (root.TryGetProperty("suggestions", out var suggestions))
            {
                return ReadStringArray(suggestions);
            }
        }
        catch
        {
            return new List<string>();
        }

        return new List<string>();
    }

    public static List<string> ApplySuggestionConstraints(
        IEnumerable<string> suggestions,
        string field,
        string query,
        IEnumerable<string> existingValues,
        int maxResults)
    {
        var normalizedQuery = (query ?? string.Empty).Trim();
        var normalizedField = NormalizeField(field);
        var effectiveMax = Math.Clamp(maxResults, 1, 12);
        var existingSet = ToNormalizedSet(existingValues);

        var result = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var value in suggestions ?? Array.Empty<string>())
        {
            var cleaned = NormalizeValue(value);
            if (string.IsNullOrWhiteSpace(cleaned))
            {
                continue;
            }

            if (existingSet.Contains(cleaned))
            {
                continue;
            }

            if (!string.IsNullOrWhiteSpace(normalizedQuery) &&
                !cleaned.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!IsFieldShapeValid(normalizedField, cleaned))
            {
                continue;
            }

            if (!seen.Add(cleaned))
            {
                continue;
            }

            result.Add(cleaned);
            if (result.Count >= effectiveMax)
            {
                break;
            }
        }

        return result;
    }

    private static string NormalizeField(string field)
    {
        return string.Equals((field ?? string.Empty).Trim(), "goal", StringComparison.OrdinalIgnoreCase)
            ? "goal"
            : "skill";
    }

    private static List<string> BuildSkillCandidates(
        IEnumerable<string> currentSkills,
        IReadOnlyCollection<SuggestionTrack> tracks)
    {
        var defaults = new[]
        {
            "TypeScript",
            "React",
            "Next.js",
            ".NET",
            "Node.js",
            "PostgreSQL",
            "API Design",
            "Testing",
            "Docker",
            "System Design",
            "Accessibility",
            "CI/CD",
        };

        var fromTracks = (tracks ?? Array.Empty<SuggestionTrack>())
            .SelectMany(track => (track.RequiredSkills ?? new List<string>())
                .Concat(track.SupportingSkills ?? new List<string>()));

        return NormalizeDistinct(
            defaults
                .Concat(currentSkills ?? Array.Empty<string>())
                .Concat(fromTracks));
    }

    private static List<string> BuildGoalCandidates(
        IEnumerable<string> currentGoals,
        IReadOnlyCollection<SuggestionTrack> tracks)
    {
        var defaults = new[]
        {
            "Write clearer technical documentation",
            "Improve communication in code reviews",
            "Lead sprint planning confidently",
            "Strengthen testing discipline for shipped features",
            "Improve architecture decision-making under constraints",
        };

        var trackGoals = (tracks ?? Array.Empty<SuggestionTrack>())
            .Select(track => $"Build portfolio evidence for {track.Role} work.")
            .Concat((tracks ?? Array.Empty<SuggestionTrack>())
                .SelectMany(track => (track.RequiredSkills ?? new List<string>())
                    .Take(2)
                    .Select(skill => $"Improve practical delivery with {skill}.")));

        return NormalizeDistinct(
            defaults
                .Concat(currentGoals ?? Array.Empty<string>())
                .Concat(trackGoals));
    }

    private static HashSet<string> ToNormalizedSet(IEnumerable<string> values)
    {
        return new HashSet<string>(
            NormalizeDistinct(values),
            StringComparer.OrdinalIgnoreCase);
    }

    private static List<string> NormalizeDistinct(IEnumerable<string> values)
    {
        var result = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var value in values ?? Array.Empty<string>())
        {
            var cleaned = NormalizeValue(value);
            if (string.IsNullOrWhiteSpace(cleaned))
            {
                continue;
            }

            if (seen.Add(cleaned))
            {
                result.Add(cleaned);
            }
        }

        return result;
    }

    private static string NormalizeValue(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return string.Join(
            " ",
            value.Trim().Split(new[] { ' ', '\t', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries));
    }

    private static bool IsFieldShapeValid(string field, string value)
    {
        if (field == "goal")
        {
            return value.Length >= 12;
        }

        return value.Length >= 2 && value.Length <= 40;
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
            .ToList();
    }

    public sealed class SuggestionTrack
    {
        public string Role { get; set; }
        public List<string> RequiredSkills { get; set; } = new();
        public List<string> SupportingSkills { get; set; } = new();
    }
}
