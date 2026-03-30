using Abp.UI;
using MosaicTalent.Domains.Companies;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace MosaicTalent.Services.CompanyJobService;

public partial class CompanyJobAppService
{
    private async Task<bool> EnsureLeetPromptProblemsAsync(Job job, JobAssessment assessment, bool forceRefresh = false)
    {
        var existing = ParseLeetPromptProblems(assessment.ContextJson);
        if (!forceRefresh && existing.Count >= 2 && !IsLegacyLeetPromptProblemSet(existing))
        {
            return false;
        }

        var workbench = ParseWorkbenchConfig(assessment.ContextJson, job);
        var generated = await GenerateLeetPromptProblemsAsync(job, assessment, workbench.WorkMode);
        if (generated.Count < 2)
        {
            throw new UserFriendlyException("Failed to generate assessment tasks. Please reload to retry.");
        }

        assessment.ContextJson = UpsertLeetPromptProblemsIntoContext(assessment.ContextJson, generated);
        return true;
    }

    private static bool HasAssessmentStarted(string contextJson)
    {
        if (string.IsNullOrWhiteSpace(contextJson))
        {
            return false;
        }

        try
        {
            using var doc = JsonDocument.Parse(contextJson);
            if (doc.RootElement.ValueKind != JsonValueKind.Object)
            {
                return false;
            }

            return doc.RootElement.TryGetProperty("assessmentStartedAt", out var startedNode) &&
                   !string.IsNullOrWhiteSpace(startedNode.GetString());
        }
        catch
        {
            return false;
        }
    }

    private static string MarkAssessmentStarted(string contextJson)
    {
        JsonObject root;
        try
        {
            root = JsonNode.Parse(string.IsNullOrWhiteSpace(contextJson) ? "{}" : contextJson)?.AsObject() ?? new JsonObject();
        }
        catch
        {
            root = new JsonObject();
        }

        root["assessmentStartedAt"] = DateTime.UtcNow.ToString("O");
        return root.ToJsonString();
    }

    private async Task<List<LeetPromptProblem>> GenerateLeetPromptProblemsAsync(Job job, JobAssessment assessment, string workMode)
    {
        if (!_groqChatService.IsConfigured())
        {
            throw new UserFriendlyException("AI assessment generation is not configured.");
        }

        var context = ParseAssessmentTaskContext(assessment.ContextJson);
        var skills = context.Skills.Count > 0 ? context.Skills : new List<string> { "communication", "problem solving" };
        var strongLanguages = context.StrongLanguages.Count > 0 ? context.StrongLanguages : new List<string> { "typescript" };
        var projects = context.Projects.Count > 0
            ? string.Join("; ", context.Projects.Select(x => $"{x.Name} [{string.Join(", ", x.Technologies)}]"))
            : "No extracted projects available.";
        var normalizedMode = NormalizeWorkMode(workMode);

        try
        {
            var systemPrompt =
                "You generate candidate-specific LeetPrompt assessment tasks. Return STRICT JSON only with key 'problems'. " +
                "Generate at least 2 and at most 5 tasks. NEVER generate algorithm puzzles. " +
                "Tasks must come only from: job description, technical/behavioural prompts, candidate CV skills, candidate project history. " +
                "Each problem object keys: id,title,description,language,starterCode,maxScore,order,publicTests[]. " +
                "publicTests[] keys: input,expectedOutput,hint. " +
                "Use practical real-world ticket language and measurable acceptance criteria.";
            var userPrompt =
                $"Role: {job.Title}\n" +
                $"Work mode: {normalizedMode}\n" +
                $"Job description: {job.Description}\n" +
                $"Technical assessment prompt: {job.TechnicalAssessmentPrompt}\n" +
                $"Behavioural assessment prompt: {job.BehaviouralAssessmentPrompt}\n" +
                $"Assessment brief: {assessment.Prompt}\n" +
                $"CV extracted skills: {string.Join(", ", skills)}\n" +
                $"CV strong languages: {string.Join(", ", strongLanguages)}\n" +
                $"CV projects: {projects}\n" +
                "Constraints:\n" +
                "- At least one task must use the technical prompt directly.\n" +
                "- At least one task must evaluate behavioural/collaboration decision making.\n" +
                "- If mode is backend, include multi-file API-style requirements.\n" +
                "- If mode is frontend, include component/state/accessibility requirements.\n" +
                "- If mode is fullstack, include API + UI integration requirements.\n" +
                "- Include realistic endpoint hints only inside task text when necessary.\n" +
                "- Keep ids kebab-case and unique.\n";

            var response = await _groqChatService.TryCompleteAsync(systemPrompt, userPrompt);
            if (string.IsNullOrWhiteSpace(response))
            {
                throw new UserFriendlyException("Assessment task generation returned an empty response.");
            }

            using var doc = JsonDocument.Parse(response);
            if (!doc.RootElement.TryGetProperty("problems", out var problemsNode) || problemsNode.ValueKind != JsonValueKind.Array)
            {
                throw new UserFriendlyException("Assessment task generation returned invalid JSON.");
            }

            var output = new List<LeetPromptProblem>();
            foreach (var node in problemsNode.EnumerateArray())
            {
                if (node.ValueKind != JsonValueKind.Object)
                {
                    continue;
                }

                var title = node.TryGetProperty("title", out var titleNode) ? SafeTrim(titleNode.GetString()) : string.Empty;
                var description = node.TryGetProperty("description", out var descriptionNode) ? SafeTrim(descriptionNode.GetString()) : string.Empty;
                if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(description))
                {
                    continue;
                }

                var id = node.TryGetProperty("id", out var idNode) ? SafeTrim(idNode.GetString()) : string.Empty;
                id = NormalizeProblemId(id, title, output.Count + 1);

                var language = node.TryGetProperty("language", out var languageNode) ? SafeTrim(languageNode.GetString()) : string.Empty;
                if (string.IsNullOrWhiteSpace(language))
                {
                    language = GuessDefaultLanguage(normalizedMode, strongLanguages);
                }

                var starterCode = node.TryGetProperty("starterCode", out var starterNode) ? starterNode.GetString() ?? string.Empty : string.Empty;
                if (string.IsNullOrWhiteSpace(starterCode))
                {
                    starterCode = DefaultStarterCode(normalizedMode, output.Count + 1, job, assessment);
                }

                var publicTests = node.TryGetProperty("publicTests", out var testsNode) ? ParseLeetPromptTests(testsNode) : new List<LeetPromptTestCase>();
                if (publicTests.Count == 0)
                {
                    publicTests = BuildDynamicPublicTestsForProblem(description, normalizedMode);
                }

                var problem = new LeetPromptProblem
                {
                    Id = id,
                    Title = title,
                    Description = description,
                    Language = language,
                    StarterCode = starterCode,
                    MaxScore = node.TryGetProperty("maxScore", out var scoreNode) && scoreNode.TryGetDouble(out var maxScore)
                        ? Math.Max(1, maxScore)
                        : 100,
                    Order = node.TryGetProperty("order", out var orderNode) && orderNode.TryGetInt32(out var parsedOrder)
                        ? parsedOrder
                        : output.Count + 1,
                    PublicTests = publicTests,
                };

                if (LooksAlgorithmic(problem))
                {
                    continue;
                }

                output.Add(problem);
            }

            var deduped = output
                .GroupBy(x => x.Id, StringComparer.OrdinalIgnoreCase)
                .Select(x => x.First())
                .OrderBy(x => x.Order)
                .ToList();

            if (deduped.Count < 2)
            {
                throw new UserFriendlyException("Generated tasks did not meet the real-world criteria.");
            }

            return deduped.Take(3).ToList();
        }
        catch (UserFriendlyException)
        {
            throw;
        }
        catch (Exception ex)
        {
            Logger.Warn("Assessment task generation failed.", ex);
            throw new UserFriendlyException("Failed to generate assessment tasks. Please reload to retry.");
        }
    }

    private static AssessmentTaskContext ParseAssessmentTaskContext(string contextJson)
    {
        if (string.IsNullOrWhiteSpace(contextJson))
        {
            return new AssessmentTaskContext();
        }

        try
        {
            using var doc = JsonDocument.Parse(contextJson);
            var root = doc.RootElement;

            var skills = root.TryGetProperty("skills", out var skillsNode) ? ReadStringArray(skillsNode) : new List<string>();
            var strongLanguages = root.TryGetProperty("strongLanguages", out var languagesNode) ? ReadStringArray(languagesNode) : new List<string>();
            var projects = new List<ProjectInsight>();
            if (root.TryGetProperty("projects", out var projectsNode) && projectsNode.ValueKind == JsonValueKind.Array)
            {
                foreach (var projectNode in projectsNode.EnumerateArray())
                {
                    if (projectNode.ValueKind != JsonValueKind.Object)
                    {
                        continue;
                    }

                    projects.Add(new ProjectInsight
                    {
                        Name = projectNode.TryGetProperty("name", out var nameNode) ? SafeTrim(nameNode.GetString()) : string.Empty,
                        Description = projectNode.TryGetProperty("description", out var descNode) ? SafeTrim(descNode.GetString()) : string.Empty,
                        Technologies = projectNode.TryGetProperty("technologies", out var techNode) ? ReadStringArray(techNode) : new List<string>(),
                    });
                }
            }

            return new AssessmentTaskContext
            {
                Skills = skills,
                StrongLanguages = strongLanguages,
                Projects = projects,
            };
        }
        catch
        {
            return new AssessmentTaskContext();
        }
    }

    private static string NormalizeProblemId(string suggestedId, string title, int order)
    {
        var candidate = string.IsNullOrWhiteSpace(suggestedId) ? title : suggestedId;
        candidate = candidate?.Trim().ToLowerInvariant() ?? string.Empty;
        candidate = Regex.Replace(candidate, @"[^a-z0-9]+", "-").Trim('-');
        if (string.IsNullOrWhiteSpace(candidate))
        {
            candidate = $"task-{order}";
        }

        return candidate;
    }

    private static string NormalizeWorkMode(string workMode)
    {
        var normalized = (workMode ?? string.Empty).Trim().ToLowerInvariant();
        if (normalized == "frontend" || normalized == "backend" || normalized == "fullstack")
        {
            return normalized;
        }

        return "fullstack";
    }

    private static string GuessDefaultLanguage(string workMode, List<string> strongLanguages)
    {
        var lower = (strongLanguages ?? new List<string>()).Select(x => x.ToLowerInvariant()).ToList();
        if (workMode == "backend")
        {
            if (lower.Any(x => x.Contains("c#") || x.Contains("dotnet")))
            {
                return "csharp";
            }

            if (lower.Any(x => x.Contains("python")))
            {
                return "python";
            }

            return "typescript";
        }

        if (lower.Any(x => x.Contains("tsx") || x.Contains("react")))
        {
            return "tsx";
        }

        return "typescript";
    }

    private static bool LooksAlgorithmic(LeetPromptProblem problem)
    {
        var corpus = $"{problem.Title} {problem.Description}".ToLowerInvariant();
        var banned = new[]
        {
            "array pair",
            "balanced bracket",
            "two sum",
            "palindrome",
            "binary tree",
            "linked list",
            "dynamic programming",
            "leetcode"
        };

        return banned.Any(corpus.Contains);
    }

    private static bool IsLegacyLeetPromptProblemSet(List<LeetPromptProblem> problems)
    {
        if (problems == null || problems.Count == 0)
        {
            return false;
        }

        var ids = problems.Select(x => (x.Id ?? string.Empty).Trim().ToLowerInvariant()).ToHashSet();
        return ids.Contains("array-sum-pairs") || ids.Contains("balanced-brackets");
    }

    private static List<LeetPromptTestCase> BuildDynamicPublicTestsForProblem(string description, string mode)
    {
        var isApi = description.Contains("/api/", StringComparison.OrdinalIgnoreCase) ||
                    description.Contains("endpoint", StringComparison.OrdinalIgnoreCase) ||
                    mode == "backend";
        if (isApi)
        {
            return new List<LeetPromptTestCase>
            {
                new LeetPromptTestCase
                {
                    Input = "Request validation and error handling",
                    ExpectedOutput = "invalid payloads return safe validation responses",
                    Hint = "Include status codes and predictable error contract."
                },
                new LeetPromptTestCase
                {
                    Input = "Success-path contract",
                    ExpectedOutput = "response schema is typed and stable",
                    Hint = "Return DTOs matching endpoint requirements."
                }
            };
        }

        return new List<LeetPromptTestCase>
        {
            new LeetPromptTestCase
            {
                Input = "Core UI/flow acceptance",
                ExpectedOutput = "required states and interactions are implemented",
                Hint = "Include loading, error, and success behavior."
            },
            new LeetPromptTestCase
            {
                Input = "Accessibility and responsiveness",
                ExpectedOutput = "controls are accessible and mobile-safe",
                Hint = "Use labels, keyboard navigation, and clear state feedback."
            }
        };
    }

    private static List<LeetPromptTestCase> ParseLeetPromptTests(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Array)
        {
            return new List<LeetPromptTestCase>();
        }

        var output = new List<LeetPromptTestCase>();
        foreach (var node in element.EnumerateArray())
        {
            if (node.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            var input = node.TryGetProperty("input", out var inputNode) ? inputNode.GetString() ?? string.Empty : string.Empty;
            var expected = node.TryGetProperty("expectedOutput", out var expectedNode) ? expectedNode.GetString() ?? string.Empty : string.Empty;
            var hint = node.TryGetProperty("hint", out var hintNode) ? hintNode.GetString() ?? string.Empty : string.Empty;
            if (string.IsNullOrWhiteSpace(input) && string.IsNullOrWhiteSpace(expected))
            {
                continue;
            }

            output.Add(new LeetPromptTestCase
            {
                Input = input,
                ExpectedOutput = expected,
                Hint = hint,
            });
        }

        return output;
    }

    private sealed class AssessmentTaskContext
    {
        public List<string> Skills { get; set; } = new();
        public List<string> StrongLanguages { get; set; } = new();
        public List<ProjectInsight> Projects { get; set; } = new();
    }
}
