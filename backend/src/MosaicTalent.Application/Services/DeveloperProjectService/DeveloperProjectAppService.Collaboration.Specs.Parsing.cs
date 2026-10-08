using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace MosaicTalent.Services.DeveloperProjectService;

public partial class DeveloperProjectAppService
{
    private static string ReadString(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var value) || value.ValueKind != JsonValueKind.String)
        {
            return string.Empty;
        }

        return value.GetString() ?? string.Empty;
    }

    private static int ReadInt(JsonElement root, string propertyName, int fallback)
    {
        if (!root.TryGetProperty(propertyName, out var value))
        {
            return fallback;
        }

        return value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var parsed)
            ? parsed
            : fallback;
    }

    private static List<string> ReadStringArray(JsonElement root, string propertyName, int maxItems)
    {
        if (!root.TryGetProperty(propertyName, out var value) || value.ValueKind != JsonValueKind.Array)
        {
            return new List<string>();
        }

        return value.EnumerateArray()
            .Where(item => item.ValueKind == JsonValueKind.String)
            .Select(item => (item.GetString() ?? string.Empty).Trim())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(maxItems)
            .ToList();
    }

    private static List<AiProjectMilestone> ReadMilestones(JsonElement root)
    {
        if (!root.TryGetProperty("milestones", out var value) || value.ValueKind != JsonValueKind.Array)
        {
            return new List<AiProjectMilestone>();
        }

        var milestones = new List<AiProjectMilestone>();
        foreach (var item in value.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            var name = ReadString(item, "name");
            if (string.IsNullOrWhiteSpace(name))
            {
                name = ReadString(item, "title");
            }

            if (string.IsNullOrWhiteSpace(name))
            {
                continue;
            }

            milestones.Add(new AiProjectMilestone
            {
                Name = name.Trim(),
                EtaWeeks = Math.Clamp(ReadInt(item, "etaWeeks", 1), 1, 52),
                Deliverables = EnsureList(ReadStringArray(item, "deliverables", 6), "Milestone deliverables to be finalized."),
            });
        }

        return milestones;
    }
}
