using Abp.UI;
using MosaicTalent.Services.CompanyJobService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;

namespace MosaicTalent.Services.CompanyJobService;

public partial class CompanyJobAppService
{
    private const int MaxVisualizationSnapshotLength = 30000;
    private const int MaxChartsPerResponse = 4;
    private const int MaxObjectProperties = 80;
    private const int MaxArrayItems = 200;
    private const int MaxJsonDepth = 8;
    private static readonly HashSet<string> AllowedTopLevelOptionKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "title",
        "legend",
        "tooltip",
        "dataset",
        "xAxis",
        "yAxis",
        "series",
        "grid",
        "radar",
        "polar",
        "angleAxis",
        "radiusAxis",
        "visualMap",
        "calendar",
        "geo",
        "toolbox",
        "dataZoom",
        "parallel",
        "parallelAxis",
        "singleAxis",
        "timeline",
        "brush",
        "aria",
    };

    public async Task<GenerateReportVisualizationWithAiDto> GenerateReportVisualizationWithAi(GenerateReportVisualizationWithAiInput input)
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var company = await GetCompanyByTenant(tenantId);
        await EnsureCompanyEmployee(company.Id);

        var prompt = input.Prompt?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(prompt))
        {
            throw new UserFriendlyException("Prompt is required.");
        }

        var snapshotJson = input.ReportSnapshotJson?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(snapshotJson))
        {
            throw new UserFriendlyException("Report snapshot is required.");
        }

        if (snapshotJson.Length > MaxVisualizationSnapshotLength)
        {
            throw new UserFriendlyException("Report snapshot is too large.");
        }

        if (!IsJsonObject(snapshotJson))
        {
            throw new UserFriendlyException("Report snapshot must be a JSON object.");
        }

        try
        {
            var aiResult = await TryGenerateVisualizationWithAi(company.Name, prompt, snapshotJson);
            if (aiResult.Charts.Count > 0)
            {
                return aiResult;
            }
        }
        catch
        {
            // Fallback keeps experience available when AI output is invalid or unavailable.
        }

        return BuildFallbackVisualization(prompt, snapshotJson);
    }

    private async Task<GenerateReportVisualizationWithAiDto> TryGenerateVisualizationWithAi(
        string companyName,
        string prompt,
        string snapshotJson)
    {
        var systemPrompt =
            "You are an advanced data visualisation engine. " +
            "Return strict JSON only with keys: title, summary, charts. " +
            "charts must be an array of 1 to 4 objects with keys: id, title, description, option. " +
            "option must be a valid Apache ECharts option object in pure JSON (no JS functions). " +
            "Prioritize clear, insightful, and varied chart styles.";
        var userPrompt =
            $"Company: {companyName}\n" +
            $"User intent: {prompt}\n" +
            "Use the following report snapshot JSON as the only data source.\n" +
            $"Report snapshot:\n{snapshotJson}";

        var response = await _groqChatService.TryCompleteAsync(systemPrompt, userPrompt);
        return ParseVisualizationResponse(response);
    }

    private GenerateReportVisualizationWithAiDto ParseVisualizationResponse(string response)
    {
        var output = new GenerateReportVisualizationWithAiDto
        {
            Title = "AI Viz Lab",
            Summary = "Generated from your latest report metrics.",
            Charts = new List<AiVisualizationChartDto>(),
        };

        if (string.IsNullOrWhiteSpace(response))
        {
            return output;
        }

        try
        {
            using var doc = JsonDocument.Parse(response);
            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
            {
                return output;
            }

            if (root.TryGetProperty("title", out var titleNode) && titleNode.ValueKind == JsonValueKind.String)
            {
                output.Title = titleNode.GetString()?.Trim() ?? output.Title;
            }

            if (root.TryGetProperty("summary", out var summaryNode) && summaryNode.ValueKind == JsonValueKind.String)
            {
                output.Summary = summaryNode.GetString()?.Trim() ?? output.Summary;
            }

            if (!root.TryGetProperty("charts", out var chartsNode) || chartsNode.ValueKind != JsonValueKind.Array)
            {
                return output;
            }

            var charts = chartsNode.EnumerateArray().Take(MaxChartsPerResponse).ToList();
            for (var index = 0; index < charts.Count; index += 1)
            {
                var chart = charts[index];
                if (chart.ValueKind != JsonValueKind.Object)
                {
                    continue;
                }

                if (!chart.TryGetProperty("option", out var optionNode) || optionNode.ValueKind != JsonValueKind.Object)
                {
                    continue;
                }

                var optionJson = SanitizeOptionJson(optionNode);
                if (string.IsNullOrWhiteSpace(optionJson))
                {
                    continue;
                }

                var id = chart.TryGetProperty("id", out var idNode) && idNode.ValueKind == JsonValueKind.String
                    ? idNode.GetString()
                    : $"chart-{index + 1}";
                var title = chart.TryGetProperty("title", out var chartTitleNode) && chartTitleNode.ValueKind == JsonValueKind.String
                    ? chartTitleNode.GetString()
                    : $"Insight {index + 1}";
                var description = chart.TryGetProperty("description", out var descriptionNode) && descriptionNode.ValueKind == JsonValueKind.String
                    ? descriptionNode.GetString()
                    : "AI-generated visualisation.";

                output.Charts.Add(new AiVisualizationChartDto
                {
                    Id = string.IsNullOrWhiteSpace(id) ? $"chart-{index + 1}" : id.Trim(),
                    Title = string.IsNullOrWhiteSpace(title) ? $"Insight {index + 1}" : title.Trim(),
                    Description = description?.Trim() ?? string.Empty,
                    OptionJson = optionJson,
                });
            }
        }
        catch
        {
            return output;
        }

        return output;
    }

    private static string SanitizeOptionJson(JsonElement optionNode)
    {
        try
        {
            var rootNode = JsonNode.Parse(optionNode.GetRawText());
            var sanitized = SanitizeNode(rootNode, 0, true) as JsonObject;
            if (sanitized == null || sanitized.Count == 0 || !sanitized.ContainsKey("series"))
            {
                return string.Empty;
            }

            return sanitized.ToJsonString();
        }
        catch
        {
            return string.Empty;
        }
    }

    private static JsonNode SanitizeNode(JsonNode node, int depth, bool isTopLevel)
    {
        if (node == null || depth > MaxJsonDepth)
        {
            return null;
        }

        if (node is JsonObject obj)
        {
            var output = new JsonObject();
            var included = 0;
            foreach (var item in obj)
            {
                if (item.Value == null)
                {
                    continue;
                }

                if (isTopLevel && !AllowedTopLevelOptionKeys.Contains(item.Key))
                {
                    continue;
                }

                if (included >= MaxObjectProperties)
                {
                    break;
                }

                var sanitized = SanitizeNode(item.Value, depth + 1, false);
                if (sanitized == null)
                {
                    continue;
                }

                output[item.Key] = sanitized;
                included += 1;
            }

            return output;
        }

        if (node is JsonArray array)
        {
            var output = new JsonArray();
            foreach (var item in array.Take(MaxArrayItems))
            {
                var sanitized = SanitizeNode(item, depth + 1, false);
                if (sanitized != null)
                {
                    output.Add(sanitized);
                }
            }

            return output;
        }

        if (node is JsonValue value)
        {
            if (value.TryGetValue<string>(out var text))
            {
                var trimmed = (text ?? string.Empty).Trim();
                if (IsUnsafeString(trimmed))
                {
                    return JsonValue.Create(string.Empty);
                }

                return JsonValue.Create(trimmed.Length > 600 ? trimmed[..600] : trimmed);
            }

            return JsonNode.Parse(value.ToJsonString());
        }

        return null;
    }

    private static bool IsUnsafeString(string value)
    {
        return value.Contains("<script", StringComparison.OrdinalIgnoreCase) ||
            value.Contains("javascript:", StringComparison.OrdinalIgnoreCase) ||
            value.Contains("function(", StringComparison.OrdinalIgnoreCase) ||
            value.Contains("=>", StringComparison.OrdinalIgnoreCase) ||
            value.Contains("onerror=", StringComparison.OrdinalIgnoreCase) ||
            value.Contains("onload=", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsJsonObject(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.ValueKind == JsonValueKind.Object;
        }
        catch
        {
            return false;
        }
    }

    private static GenerateReportVisualizationWithAiDto BuildFallbackVisualization(string prompt, string snapshotJson)
    {
        using var doc = JsonDocument.Parse(snapshotJson);
        var root = doc.RootElement;
        var trends = root.TryGetProperty("trends", out var trendsNode) && trendsNode.ValueKind == JsonValueKind.Array
            ? trendsNode.EnumerateArray().ToList()
            : new List<JsonElement>();
        var sources = root.TryGetProperty("sources", out var sourcesNode) && sourcesNode.ValueKind == JsonValueKind.Array
            ? sourcesNode.EnumerateArray().ToList()
            : new List<JsonElement>();

        var monthLabels = trends.Select(x => x.TryGetProperty("monthLabel", out var month) ? month.GetString() ?? "N/A" : "N/A").ToList();
        var monthApplications = trends.Select(x => x.TryGetProperty("applications", out var value) && value.TryGetInt32(out var parsed) ? parsed : 0).ToList();
        var sourceLabels = sources.Select(x => x.TryGetProperty("source", out var source) ? source.GetString() ?? "other" : "other").ToList();
        var sourceValues = sources.Select(x => x.TryGetProperty("count", out var value) && value.TryGetInt32(out var parsed) ? parsed : 0).ToList();

        var trendOption = JsonSerializer.Serialize(new
        {
            tooltip = new { trigger = "axis" },
            xAxis = new { type = "category", data = monthLabels },
            yAxis = new { type = "value" },
            series = new object[]
            {
                new { name = "Applications", type = "line", smooth = true, data = monthApplications },
                new { name = "Applications (bars)", type = "bar", data = monthApplications },
            }
        });
        var sourceOption = JsonSerializer.Serialize(new
        {
            tooltip = new { trigger = "item" },
            series = new object[]
            {
                new
                {
                    name = "Sources",
                    type = "pie",
                    radius = new[] { "35%", "65%" },
                    data = sourceLabels.Select((label, idx) => new { name = label, value = sourceValues.ElementAtOrDefault(idx) }),
                }
            }
        });

        return new GenerateReportVisualizationWithAiDto
        {
            Title = "AI Viz Lab",
            Summary = $"Generated from prompt: {prompt}",
            Charts = new List<AiVisualizationChartDto>
            {
                new()
                {
                    Id = "fallback-trend",
                    Title = "Hiring Trend Dynamics",
                    Description = "Line and bar composition over monthly applications.",
                    OptionJson = trendOption,
                },
                new()
                {
                    Id = "fallback-source",
                    Title = "Source Mix Composition",
                    Description = "Donut split of application source channels.",
                    OptionJson = sourceOption,
                }
            }
        };
    }
}
