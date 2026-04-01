using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace MosaicTalent.Services.DeveloperProjectService;

public partial class DeveloperProjectAppService
{
    private static string BuildStructuredProjectSpecMarkdown(
        AiProjectSpecDraft draft,
        string prompt,
        string repoHint,
        string title,
        IReadOnlyCollection<string> skills,
        string difficulty,
        int estimatedHoursPerWeek)
    {
        var overview = string.IsNullOrWhiteSpace(draft.Overview)
            ? BuildFallbackOverview(prompt, repoHint, title)
            : draft.Overview.Trim();
        var problemStatement = string.IsNullOrWhiteSpace(draft.ProblemStatement)
            ? "Teams need a clear, testable scope to deliver confidently without rework."
            : draft.ProblemStatement.Trim();

        var goals = EnsureList(
            draft.Goals,
            "Deliver a usable first version with core user flows.",
            "Keep delivery incremental with clear checkpoints.",
            "Maintain code quality through review and targeted tests.");
        var nonGoals = EnsureList(
            draft.NonGoals,
            "Do not implement unrelated stretch features in this iteration.",
            "Do not skip safety, quality, or documentation baselines.");
        var targetUsers = EnsureList(
            draft.TargetUsers,
            "Project members collaborating on implementation tasks.",
            "Project lead coordinating scope, milestones, and quality.");
        var functionalRequirements = EnsureList(
            draft.FunctionalRequirements,
            "Provide the main user workflow from start to completion.",
            "Capture and expose project status for team visibility.",
            "Track tasks with ownership and measurable completion criteria.");
        var nonFunctionalRequirements = EnsureList(
            draft.NonFunctionalRequirements,
            "Critical flows should be covered by automated tests.",
            "UI must remain responsive on mobile and desktop.",
            "Error states should return actionable feedback.");
        var technicalApproach = EnsureList(
            draft.TechnicalApproach,
            "Define a small vertical slice first, then expand iteratively.",
            "Use provider-based API access and keep components presentation-focused.",
            "Document architectural decisions and tradeoffs.");
        var risks = EnsureList(
            draft.Risks,
            "Scope growth can delay delivery if not controlled.",
            "Dependency or integration changes can introduce regressions.");
        var acceptanceCriteria = EnsureList(
            draft.AcceptanceCriteria,
            "Core workflow is demonstrable end-to-end.",
            "All acceptance scenarios have clear pass/fail outcomes.",
            "Critical defects are resolved before release.");
        var definitionOfDone = EnsureList(
            draft.DefinitionOfDone,
            "Implementation merged with review approval.",
            "Automated tests pass for affected areas.",
            "Project documentation is updated.");
        var milestones = draft.Milestones.Count == 0
            ? BuildDefaultMilestones()
            : draft.Milestones;

        var builder = new StringBuilder();
        builder.AppendLine($"# {title}");
        builder.AppendLine();
        builder.AppendLine("## Project Metadata");
        builder.AppendLine($"- Difficulty: {difficulty}");
        builder.AppendLine($"- Estimated Hours / Week: {estimatedHoursPerWeek}");
        builder.AppendLine($"- Suggested Skills: {string.Join(", ", skills)}");
        builder.AppendLine();
        builder.AppendLine("## 1. Overview");
        builder.AppendLine(overview);
        builder.AppendLine();
        builder.AppendLine("## 2. Problem Statement");
        builder.AppendLine(problemStatement);
        builder.AppendLine();
        AppendSectionList(builder, "## 3. Goals", goals);
        AppendSectionList(builder, "## 4. Non-Goals", nonGoals);
        AppendSectionList(builder, "## 5. Target Users", targetUsers);
        AppendSectionList(builder, "## 6. Functional Requirements", functionalRequirements);
        AppendSectionList(builder, "## 7. Non-Functional Requirements", nonFunctionalRequirements);
        AppendSectionList(builder, "## 8. Technical Approach", technicalApproach);
        AppendMilestones(builder, milestones);
        AppendSectionList(builder, "## 10. Risks and Mitigations", risks);
        AppendSectionList(builder, "## 11. Acceptance Criteria", acceptanceCriteria);
        AppendSectionList(builder, "## 12. Definition of Done", definitionOfDone);

        return builder.ToString().Trim();
    }

    private static void AppendSectionList(StringBuilder builder, string heading, IReadOnlyCollection<string> items)
    {
        builder.AppendLine(heading);
        foreach (var item in items)
        {
            builder.AppendLine($"- {item}");
        }
        builder.AppendLine();
    }

    private static void AppendMilestones(StringBuilder builder, IReadOnlyCollection<AiProjectMilestone> milestones)
    {
        builder.AppendLine("## 9. Milestones");
        var index = 1;
        foreach (var milestone in milestones)
        {
            builder.AppendLine($"{index}. **{milestone.Name}** (ETA: Week {milestone.EtaWeeks})");
            foreach (var deliverable in milestone.Deliverables)
            {
                builder.AppendLine($"- {deliverable}");
            }
            index++;
        }
        builder.AppendLine();
    }

    private static string BuildFallbackOverview(string prompt, string repoHint, string title)
    {
        if (!string.IsNullOrWhiteSpace(prompt))
        {
            return $"Build `{title}` based on this prompt: {prompt.Trim()}";
        }

        if (!string.IsNullOrWhiteSpace(repoHint))
        {
            return $"Create a project scoped around repository `{repoHint.Trim()}` with concrete delivery milestones.";
        }

        return $"Build `{title}` as a collaborative team project with a clear delivery plan.";
    }

    private static List<string> EnsureList(List<string> values, params string[] fallbacks)
    {
        return values != null && values.Count > 0
            ? values
            : fallbacks.ToList();
    }

    private static List<AiProjectMilestone> BuildDefaultMilestones()
    {
        return new List<AiProjectMilestone>
        {
            new()
            {
                Name = "Discovery and Planning",
                EtaWeeks = 1,
                Deliverables = new List<string> { "Problem framing", "Initial architecture and backlog" },
            },
            new()
            {
                Name = "Implementation",
                EtaWeeks = 2,
                Deliverables = new List<string> { "Core feature development", "Automated tests for primary workflows" },
            },
            new()
            {
                Name = "Validation and Release",
                EtaWeeks = 3,
                Deliverables = new List<string> { "Bug fixes and polish", "Demo and delivery notes" },
            },
        };
    }
}
