using Abp.Authorization;
using Abp.UI;
using MosaicTalent.Services.AiService;
using MosaicTalent.Services.AppOperatorService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace MosaicTalent.Services.AppOperatorService;

[AbpAuthorize]
public class AppOperatorAppService : MosaicTalentAppServiceBase, IAppOperatorAppService
{
    private static readonly HashSet<string> AllowedModes = new(StringComparer.OrdinalIgnoreCase)
    {
        "execute",
        "chat",
        "guided",
    };

    private readonly IGroqChatService _groqChatService;

    public AppOperatorAppService(IGroqChatService groqChatService)
    {
        _groqChatService = groqChatService;
    }

    public async Task<AppOperatorPlanDto> Plan(AppOperatorPlanInput input)
    {
        var context = NormalizeContext(input);
        if (string.IsNullOrWhiteSpace(context.Command))
        {
            throw new UserFriendlyException("Command is required for planning.");
        }

        if (!_groqChatService.IsConfigured())
        {
            throw new UserFriendlyException("App operator AI planning is not configured.");
        }

        var systemPrompt = BuildSystemPrompt();
        var userPrompt = BuildUserPrompt(context);
        var completion = await _groqChatService.TryCompleteAsync(systemPrompt, userPrompt);

        if (string.IsNullOrWhiteSpace(completion))
        {
            throw new UserFriendlyException("AI planner did not return a valid response.");
        }

        var parsed = TryParsePlan(completion);
        if (parsed == null)
        {
            throw new UserFriendlyException("AI planner response was malformed.");
        }

        var normalized = NormalizePlan(parsed, context);
        normalized.UsedAi = true;
        return normalized;
    }

    private static PlannerContext NormalizeContext(AppOperatorPlanInput input)
    {
        var normalizedInput = input ?? new AppOperatorPlanInput();

        var routes = (normalizedInput.Routes ?? new List<AppOperatorRouteDescriptorDto>())
            .Where(route => !string.IsNullOrWhiteSpace(route?.Key))
            .GroupBy(route => route.Key.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .ToDictionary(
                route => route.Key.Trim(),
                route => route,
                StringComparer.OrdinalIgnoreCase);

        var actions = (normalizedInput.Actions ?? new List<AppOperatorActionDescriptorDto>())
            .Where(action => !string.IsNullOrWhiteSpace(action?.Id))
            .GroupBy(action => action.Id.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .ToDictionary(
                action => action.Id.Trim(),
                action => action,
                StringComparer.OrdinalIgnoreCase);

        return new PlannerContext
        {
            Command = (normalizedInput.Command ?? string.Empty).Trim(),
            CurrentPath = (normalizedInput.CurrentPath ?? string.Empty).Trim(),
            Routes = routes,
            Actions = actions,
        };
    }

    private static string BuildSystemPrompt()
    {
        return
            "You are the MosaicTalent app operator planner. " +
            "Convert each user command into a strict JSON execution plan. " +
            "Return JSON only with this shape: " +
            "{\"mode\":\"execute|chat|guided\",\"type\":\"navigate|action_id\",\"routeKey\":\"optional\",\"params\":{},\"missingRequired\":[],\"requiresConfirmation\":false,\"narration\":\"short\",\"assistantReply\":\"short\",\"shouldOfferExecution\":false,\"steps\":[{\"id\":\"s1\",\"title\":\"step\"}]}. " +
            "Rules: " +
            "1) mode=execute for direct actions, chat for explanation only, guided for step walkthrough. " +
            "2) type must be navigate or one of the provided action ids when execution is intended. " +
            "3) routeKey must be one of the provided route keys when present. " +
            "4) params values must be plain strings. " +
            "5) Never invent routes or actions. " +
            "6) If required inputs are missing, list them in missingRequired. " +
            "7) For chat/guided, provide assistantReply. " +
            "8) For guided, provide 3-8 concise steps. " +
            "9) Keep narration concise.";
    }

    private static string BuildUserPrompt(PlannerContext context)
    {
        var payload = new
        {
            command = context.Command,
            currentPath = context.CurrentPath,
            routes = context.Routes.Values.Select(route => new
            {
                key = route.Key,
                path = route.Path,
                label = route.Label,
            }),
            actions = context.Actions.Values.Select(action => new
            {
                id = action.Id,
                name = action.Name,
                description = action.Description,
                routeKey = action.RouteKey,
                requiredInputs = action.RequiredInputs ?? new List<string>(),
                optionalInputs = action.OptionalInputs ?? new List<string>(),
                requiresConfirmation = action.RequiresConfirmation,
            }),
        };

        return JsonSerializer.Serialize(payload);
    }

    private static AppOperatorPlanDto TryParsePlan(string response)
    {
        try
        {
            using var document = JsonDocument.Parse(response);
            var root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            return new AppOperatorPlanDto
            {
                Mode = ReadString(root, "mode"),
                Type = ReadString(root, "type"),
                RouteKey = ReadString(root, "routeKey"),
                Params = ReadStringMap(root, "params"),
                MissingRequired = ReadStringList(root, "missingRequired"),
                RequiresConfirmation = ReadBoolean(root, "requiresConfirmation"),
                Narration = ReadString(root, "narration"),
                AssistantReply = ReadString(root, "assistantReply"),
                ShouldOfferExecution = ReadBoolean(root, "shouldOfferExecution"),
                Steps = ReadSteps(root, "steps"),
            };
        }
        catch
        {
            return null;
        }
    }

    private static AppOperatorPlanDto NormalizePlan(AppOperatorPlanDto plan, PlannerContext context)
    {
        var mode = NormalizeMode(plan.Mode);
        var rawType = string.IsNullOrWhiteSpace(plan.Type) ? "navigate" : plan.Type.Trim();
        var isExecutionTypeSupported = IsSupportedType(rawType, context);
        var normalizedType = isExecutionTypeSupported
            ? rawType
            : "navigate";
        string canonicalRouteKey;
        var normalized = new AppOperatorPlanDto
        {
            Mode = mode,
            Type = normalizedType,
            RouteKey = plan.RouteKey?.Trim(),
            Params = NormalizeStringMap(plan.Params),
            MissingRequired = new List<string>(),
            RequiresConfirmation = plan.RequiresConfirmation,
            Narration = plan.Narration?.Trim(),
            AssistantReply = plan.AssistantReply?.Trim(),
            ShouldOfferExecution = plan.ShouldOfferExecution && isExecutionTypeSupported,
            Steps = NormalizeSteps(plan.Steps),
        };

        if (string.Equals(normalized.Type, "navigate", StringComparison.OrdinalIgnoreCase))
        {
            if (!TryResolveRouteKey(normalized.RouteKey, context.Routes, out canonicalRouteKey))
            {
                canonicalRouteKey = context.Routes.Keys.FirstOrDefault();
            }

            normalized.Type = "navigate";
            normalized.RouteKey = canonicalRouteKey;
            normalized.RequiresConfirmation = false;
            return normalized;
        }

        if (!context.Actions.TryGetValue(normalized.Type, out var action))
        {
            return normalized;
        }

        normalized.Type = action.Id;
        normalized.RequiresConfirmation = action.RequiresConfirmation;

        if (!TryResolveRouteKey(normalized.RouteKey, context.Routes, out canonicalRouteKey))
        {
            canonicalRouteKey = ResolveRouteFromAction(action, context.Routes);
        }

        normalized.RouteKey = canonicalRouteKey;
        normalized.MissingRequired = ResolveMissingRequired(action.RequiredInputs, normalized.Params);

        if (!normalized.ShouldOfferExecution && string.Equals(normalized.Mode, "execute", StringComparison.OrdinalIgnoreCase))
        {
            normalized.ShouldOfferExecution = true;
        }

        return normalized;
    }

    private static bool IsSupportedType(string type, PlannerContext context)
    {
        if (string.IsNullOrWhiteSpace(type))
        {
            return false;
        }

        if (string.Equals(type.Trim(), "navigate", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return context.Actions.ContainsKey(type.Trim());
    }

    private static string NormalizeMode(string mode)
    {
        var normalized = string.IsNullOrWhiteSpace(mode) ? "execute" : mode.Trim().ToLowerInvariant();
        return AllowedModes.Contains(normalized) ? normalized : "execute";
    }

    private static List<string> ResolveMissingRequired(List<string> requiredInputs, Dictionary<string, string> parameters)
    {
        if (requiredInputs == null || requiredInputs.Count == 0)
        {
            return new List<string>();
        }

        var normalizedParams = parameters ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        return requiredInputs
            .Where(field => !normalizedParams.TryGetValue(field, out var value) || string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string ResolveRouteFromAction(
        AppOperatorActionDescriptorDto action,
        IReadOnlyDictionary<string, AppOperatorRouteDescriptorDto> routes)
    {
        if (action == null || string.IsNullOrWhiteSpace(action.RouteKey))
        {
            return null;
        }

        return TryResolveRouteKey(action.RouteKey, routes, out var canonicalRouteKey)
            ? canonicalRouteKey
            : null;
    }

    private static bool TryResolveRouteKey(
        string inputRouteKey,
        IReadOnlyDictionary<string, AppOperatorRouteDescriptorDto> routes,
        out string canonicalRouteKey)
    {
        canonicalRouteKey = null;
        if (string.IsNullOrWhiteSpace(inputRouteKey) || routes == null || routes.Count == 0)
        {
            return false;
        }

        if (!routes.TryGetValue(inputRouteKey.Trim(), out var route) || route == null)
        {
            return false;
        }

        canonicalRouteKey = route.Key;
        return true;
    }

    private static Dictionary<string, string> NormalizeStringMap(Dictionary<string, string> input)
    {
        var normalized = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (input == null)
        {
            return normalized;
        }

        foreach (var pair in input)
        {
            if (string.IsNullOrWhiteSpace(pair.Key))
            {
                continue;
            }

            normalized[pair.Key.Trim()] = pair.Value?.Trim() ?? string.Empty;
        }

        return normalized;
    }

    private static Dictionary<string, string> ReadStringMap(JsonElement root, string propertyName)
    {
        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (!TryGetPropertyIgnoreCase(root, propertyName, out var mapElement) ||
            mapElement.ValueKind != JsonValueKind.Object)
        {
            return result;
        }

        foreach (var property in mapElement.EnumerateObject())
        {
            var key = property.Name?.Trim();
            if (string.IsNullOrWhiteSpace(key))
            {
                continue;
            }

            result[key] = ConvertJsonToString(property.Value);
        }

        return result;
    }

    private static List<string> ReadStringList(JsonElement root, string propertyName)
    {
        var values = new List<string>();
        if (!TryGetPropertyIgnoreCase(root, propertyName, out var listElement) ||
            listElement.ValueKind != JsonValueKind.Array)
        {
            return values;
        }

        foreach (var item in listElement.EnumerateArray())
        {
            var value = ConvertJsonToString(item);
            if (!string.IsNullOrWhiteSpace(value))
            {
                values.Add(value);
            }
        }

        return values.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static List<AppOperatorPlanStepDto> ReadSteps(JsonElement root, string propertyName)
    {
        var steps = new List<AppOperatorPlanStepDto>();
        if (!TryGetPropertyIgnoreCase(root, propertyName, out var listElement) ||
            listElement.ValueKind != JsonValueKind.Array)
        {
            return steps;
        }

        var index = 0;
        foreach (var item in listElement.EnumerateArray())
        {
            index++;
            var title = ReadStepTitle(item);
            if (string.IsNullOrWhiteSpace(title))
            {
                continue;
            }

            steps.Add(new AppOperatorPlanStepDto
            {
                Id = $"s{index}",
                Title = title,
            });
        }

        return steps;
    }

    private static string ReadStepTitle(JsonElement item)
    {
        if (item.ValueKind == JsonValueKind.String)
        {
            return (item.GetString() ?? string.Empty).Trim();
        }

        if (item.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return ReadString(item, "title")
               ?? ReadString(item, "text")
               ?? ReadString(item, "label");
    }

    private static List<AppOperatorPlanStepDto> NormalizeSteps(List<AppOperatorPlanStepDto> steps)
    {
        if (steps == null || steps.Count == 0)
        {
            return new List<AppOperatorPlanStepDto>();
        }

        var normalized = steps
            .Select((step, index) => new AppOperatorPlanStepDto
            {
                Id = string.IsNullOrWhiteSpace(step.Id) ? $"s{index + 1}" : step.Id.Trim(),
                Title = step.Title?.Trim() ?? string.Empty,
            })
            .Where(step => !string.IsNullOrWhiteSpace(step.Title))
            .Take(8)
            .ToList();

        return normalized;
    }

    private static string ReadString(JsonElement root, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(root, propertyName, out var value))
        {
            return null;
        }

        var parsed = ConvertJsonToString(value);
        return string.IsNullOrWhiteSpace(parsed) ? null : parsed;
    }

    private static bool ReadBoolean(JsonElement root, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(root, propertyName, out var value))
        {
            return false;
        }

        return value.ValueKind == JsonValueKind.True ||
               (value.ValueKind == JsonValueKind.String && bool.TryParse(value.GetString(), out var parsed) && parsed);
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement element, string propertyName, out JsonElement value)
    {
        foreach (var property in element.EnumerateObject())
        {
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;
                return true;
            }
        }

        value = default;
        return false;
    }

    private static string ConvertJsonToString(JsonElement value)
    {
        return value.ValueKind switch
        {
            JsonValueKind.String => (value.GetString() ?? string.Empty).Trim(),
            JsonValueKind.Number => value.GetRawText(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            JsonValueKind.Null => string.Empty,
            _ => value.GetRawText().Trim(),
        };
    }

    private sealed class PlannerContext
    {
        public string Command { get; set; }

        public string CurrentPath { get; set; }

        public Dictionary<string, AppOperatorRouteDescriptorDto> Routes { get; set; }

        public Dictionary<string, AppOperatorActionDescriptorDto> Actions { get; set; }
    }
}
