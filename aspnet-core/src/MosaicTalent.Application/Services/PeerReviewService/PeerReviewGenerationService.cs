using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.Notifications;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Domains.Reviews;
using MosaicTalent.Services.AiService;
using MosaicTalent.Services.NotificationChannelService;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace MosaicTalent.Services.PeerReviewService;

public class PeerReviewGenerationService : IPeerReviewGenerationService, ITransientDependency
{
    private readonly IRepository<Project, Guid> _projectRepository;
    private readonly IRepository<ProjectMember, Guid> _projectMemberRepository;
    private readonly IRepository<ProjectSkill, Guid> _projectSkillRepository;
    private readonly IRepository<ProjectTask, Guid> _projectTaskRepository;
    private readonly IRepository<ProjectProgressEntry, Guid> _projectProgressEntryRepository;
    private readonly IRepository<Developer, Guid> _developerRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly IRepository<DeveloperProfile, Guid> _developerProfileRepository;
    private readonly IRepository<DeveloperProfileSkill, Guid> _developerProfileSkillRepository;
    private readonly IRepository<DeveloperProfileGoal, Guid> _developerProfileGoalRepository;
    private readonly IRepository<PeerReview, Guid> _peerReviewRepository;
    private readonly IRepository<AIReviewQuestion, Guid> _questionRepository;
    private readonly IRepository<AIReviewFeedback, Guid> _feedbackRepository;
    private readonly IGroqChatService _groqChatService;
    private readonly INotificationEventDispatcher _notificationEventDispatcher;

    public PeerReviewGenerationService(
        IRepository<Project, Guid> projectRepository,
        IRepository<ProjectMember, Guid> projectMemberRepository,
        IRepository<ProjectSkill, Guid> projectSkillRepository,
        IRepository<ProjectTask, Guid> projectTaskRepository,
        IRepository<ProjectProgressEntry, Guid> projectProgressEntryRepository,
        IRepository<Developer, Guid> developerRepository,
        IRepository<User, long> userRepository,
        IRepository<DeveloperProfile, Guid> developerProfileRepository,
        IRepository<DeveloperProfileSkill, Guid> developerProfileSkillRepository,
        IRepository<DeveloperProfileGoal, Guid> developerProfileGoalRepository,
        IRepository<PeerReview, Guid> peerReviewRepository,
        IRepository<AIReviewQuestion, Guid> questionRepository,
        IRepository<AIReviewFeedback, Guid> feedbackRepository,
        IGroqChatService groqChatService,
        INotificationEventDispatcher notificationEventDispatcher)
    {
        _projectRepository = projectRepository;
        _projectMemberRepository = projectMemberRepository;
        _projectSkillRepository = projectSkillRepository;
        _projectTaskRepository = projectTaskRepository;
        _projectProgressEntryRepository = projectProgressEntryRepository;
        _developerRepository = developerRepository;
        _userRepository = userRepository;
        _developerProfileRepository = developerProfileRepository;
        _developerProfileSkillRepository = developerProfileSkillRepository;
        _developerProfileGoalRepository = developerProfileGoalRepository;
        _peerReviewRepository = peerReviewRepository;
        _questionRepository = questionRepository;
        _feedbackRepository = feedbackRepository;
        _groqChatService = groqChatService;
        _notificationEventDispatcher = notificationEventDispatcher;
    }

    public async Task<int> RequestPeerReviewFromTeammates(
        Guid projectId,
        int tenantId,
        Guid revieweeDeveloperId)
    {
        var project = await _projectRepository.FirstOrDefaultAsync(projectId)
            ?? throw new UserFriendlyException("Project not found.");
        var members = await _projectMemberRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .ToListAsync();
        var membership = members.FirstOrDefault(x => x.DeveloperId == revieweeDeveloperId);
        var now = DateTime.UtcNow;
        var latestRequestReview = await _peerReviewRepository.GetAll()
            .Where(x => x.ProjectId == projectId && x.RevieweeDeveloperId == revieweeDeveloperId && x.IsEarlyRequest)
            .OrderByDescending(x => x.CreationTime)
            .FirstOrDefaultAsync();
        var eligibility = PeerReviewRequestPolicy.Evaluate(
            project.Status,
            membership != null,
            members.Select(x => x.DeveloperId).Distinct().Count(),
            membership?.CreationTime,
            latestRequestReview?.CreationTime,
            now);
        if (!eligibility.CanRequest)
        {
            throw new UserFriendlyException(eligibility.Message);
        }

        var reviewerIds = members
            .Select(x => x.DeveloperId)
            .Where(x => x != revieweeDeveloperId)
            .Distinct()
            .ToList();
        var projectSkills = await _projectSkillRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .Select(x => x.Name)
            .ToListAsync();
        var tasks = await _projectTaskRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .ToListAsync();
        var progressEntries = await _projectProgressEntryRepository.GetAll()
            .Where(x => x.ProjectId == projectId && x.DeveloperId == revieweeDeveloperId)
            .OrderByDescending(x => x.CreationTime)
            .Take(20)
            .ToListAsync();
        var reviewers = await _developerRepository.GetAll()
            .Where(x => reviewerIds.Contains(x.Id))
            .ToListAsync();

        foreach (var reviewerId in reviewerIds)
        {
            var review = new PeerReview
            {
                TenantId = tenantId,
                ProjectId = projectId,
                ReviewerDeveloperId = reviewerId,
                RevieweeDeveloperId = revieweeDeveloperId,
                IsEarlyRequest = true,
                Rating = 5,
            };
            await _peerReviewRepository.InsertAsync(review);

            var questions = await GenerateQuestions(
                project,
                projectSkills,
                tasks,
                progressEntries,
                reviewerId,
                revieweeDeveloperId);
            foreach (var question in questions)
            {
                await _questionRepository.InsertAsync(new AIReviewQuestion
                {
                    TenantId = tenantId,
                    PeerReviewId = review.Id,
                    Text = question.Text,
                    Type = question.Type,
                    RelatedGoal = question.RelatedGoal,
                    Category = question.Category,
                });
            }
        }

        var reviewerUserIds = reviewers
            .Where(x => x.UserId > 0)
            .Select(x => x.UserId)
            .Distinct()
            .ToArray();
        if (reviewerUserIds.Length > 0)
        {
            var message = $"A teammate requested your anonymous peer review for \"{project.Title}\".";
            await _notificationEventDispatcher.NotifyUsersAsync(
                tenantId,
                reviewerUserIds,
                "MosaicTalent.PeerReviewAssigned",
                message,
                NotificationSeverity.Info,
                "/app/reviews",
                "Peer review requested",
                message);
        }

        return reviewerIds.Count;
    }

    public async Task EnsureGeneratedForProject(Guid projectId, int tenantId)
    {
        var project = await _projectRepository.FirstOrDefaultAsync(projectId);
        if (project == null || project.Status != ProjectStatus.Complete)
        {
            return;
        }

        var members = await _projectMemberRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .ToListAsync();

        if (members.Count < 2)
        {
            return;
        }

        var existingReviews = await _peerReviewRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .ToListAsync();
        var newAssignmentsByReviewer = new Dictionary<Guid, int>();

        var memberIds = members.Select(x => x.DeveloperId).Distinct().ToList();
        var developers = await _developerRepository.GetAll()
            .Where(x => memberIds.Contains(x.Id))
            .ToListAsync();
        var usersById = await BuildUsersByDeveloper(developers);
        var projectSkills = await _projectSkillRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .Select(x => x.Name)
            .ToListAsync();
        var tasks = await _projectTaskRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .ToListAsync();
        var progressEntries = await _projectProgressEntryRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .OrderByDescending(x => x.CreationTime)
            .ToListAsync();

        foreach (var reviewerId in memberIds)
        {
            foreach (var revieweeId in memberIds.Where(x => x != reviewerId))
            {
                var exists = existingReviews.Any(x =>
                    x.ReviewerDeveloperId == reviewerId &&
                    x.RevieweeDeveloperId == revieweeId &&
                    !x.IsEarlyRequest);
                if (exists)
                {
                    continue;
                }

                var review = new PeerReview
                {
                    TenantId = tenantId,
                    ProjectId = projectId,
                    ReviewerDeveloperId = reviewerId,
                    RevieweeDeveloperId = revieweeId,
                    Rating = 5,
                };
                await _peerReviewRepository.InsertAsync(review);
                if (!newAssignmentsByReviewer.ContainsKey(reviewerId))
                {
                    newAssignmentsByReviewer[reviewerId] = 0;
                }
                newAssignmentsByReviewer[reviewerId] += 1;

                var questions = await GenerateQuestions(
                    project,
                    projectSkills,
                    tasks,
                    progressEntries.Where(x => x.DeveloperId == revieweeId).Take(20).ToList(),
                    reviewerId,
                    revieweeId);

                foreach (var question in questions)
                {
                    await _questionRepository.InsertAsync(new AIReviewQuestion
                    {
                        TenantId = tenantId,
                        PeerReviewId = review.Id,
                        Text = question.Text,
                        Type = question.Type,
                        RelatedGoal = question.RelatedGoal,
                        Category = question.Category,
                    });
                }
            }
        }

        if (newAssignmentsByReviewer.Count > 0)
        {
            foreach (var assignment in newAssignmentsByReviewer)
            {
                var reviewer = developers.FirstOrDefault(x => x.Id == assignment.Key);
                if (reviewer == null || reviewer.UserId <= 0)
                {
                    continue;
                }

                var message = $"You have {assignment.Value} new peer review assignment(s) for \"{project.Title}\".";
                await _notificationEventDispatcher.NotifyUsersAsync(
                    tenantId,
                    new[] { reviewer.UserId },
                    "MosaicTalent.PeerReviewAssigned",
                    message,
                    NotificationSeverity.Info,
                    "/app/reviews",
                    "Peer review assigned",
                    message);
            }
        }
        var feedback = await _feedbackRepository.GetAll()
            .FirstOrDefaultAsync(x => x.ProjectId == projectId);
        if (feedback == null)
        {
            var generated = await GenerateFeedback(project, projectSkills, tasks, memberIds.Count);
            await _feedbackRepository.InsertAsync(new AIReviewFeedback
            {
                TenantId = tenantId,
                ProjectId = projectId,
                Summary = generated.Summary,
                StrengthsJson = JsonSerializer.Serialize(generated.Strengths),
                ImprovementAreasJson = JsonSerializer.Serialize(generated.ImprovementAreas),
                TipsJson = JsonSerializer.Serialize(generated.Tips),
                GrowthScore = generated.GrowthScore,
            });
        }
    }

    private async Task<Dictionary<Guid, string>> BuildUsersByDeveloper(List<Developer> developers)
    {
        var userIds = developers.Select(x => x.UserId).Distinct().ToList();
        var users = await _userRepository.GetAll()
            .Where(x => userIds.Contains(x.Id))
            .ToListAsync();
        var usersById = users.ToDictionary(x => x.Id, x =>
        {
            var fullName = string.Join(" ", new[] { x.Name, x.Surname }.Where(name => !string.IsNullOrWhiteSpace(name)));
            return string.IsNullOrWhiteSpace(fullName) ? x.UserName : fullName;
        });

        return developers.ToDictionary(
            x => x.Id,
            x => usersById.TryGetValue(x.UserId, out var name) ? name : "Developer");
    }

    private async Task<List<GeneratedQuestion>> GenerateQuestions(
        Project project,
        List<string> projectSkills,
        List<ProjectTask> tasks,
        List<ProjectProgressEntry> progressEntries,
        Guid reviewerId,
        Guid revieweeId)
    {
        var reviewerGoals = await GetGoals(reviewerId);
        var revieweeSkills = await GetSkills(revieweeId);
        var completedTasks = tasks.Count(x => x.Status == ProjectTaskStatus.Done);

        var fallback = new List<GeneratedQuestion>
        {
            new GeneratedQuestion
            {
                Text = $"How effectively did your anonymous teammate collaborate with you during {project.Title}?",
                Type = "open",
                RelatedGoal = reviewerGoals.FirstOrDefault() ?? "Collaboration",
                Category = "Teamwork",
            },
            new GeneratedQuestion
            {
                Text = $"Which {revieweeSkills.FirstOrDefault() ?? "technical"} contribution from your anonymous teammate had the biggest impact?",
                Type = "open",
                RelatedGoal = projectSkills.FirstOrDefault() ?? "Project Delivery",
                Category = "Impact",
            },
            new GeneratedQuestion
            {
                Text = "What should your anonymous teammate improve in future projects based on this interaction?",
                Type = "open",
                RelatedGoal = reviewerGoals.Skip(1).FirstOrDefault() ?? "Growth",
                Category = "Improvement",
            },
        };

        if (!_groqChatService.IsConfigured())
        {
            return fallback;
        }

        var payload = new
        {
            project = new
            {
                title = project.Title,
                description = project.Description,
                skills = projectSkills,
                completedTasks,
                totalTasks = tasks.Count,
            },
            reviewer = new
            {
                goals = reviewerGoals,
            },
            reviewee = new
            {
                skills = revieweeSkills,
                documentedWork = progressEntries.Select(entry => new
                {
                    entry.Title,
                    entry.Summary,
                    entry.SelfReview,
                }),
            },
        };

        var systemPrompt = "Generate exactly 3 constructive peer review questions as JSON: {\"questions\":[{\"text\":\"\",\"type\":\"open\",\"relatedGoal\":\"\",\"category\":\"\"}]}. Use the reviewee's documented work, self-reflections, project context, and reviewer goals when available. Do not ask for information already present in the documented work.";
        var response = await _groqChatService.TryCompleteAsync(systemPrompt, JsonSerializer.Serialize(payload));
        if (string.IsNullOrWhiteSpace(response))
        {
            return fallback;
        }

        try
        {
            using var document = JsonDocument.Parse(response);
            if (!document.RootElement.TryGetProperty("questions", out var questionsElement) ||
                questionsElement.ValueKind != JsonValueKind.Array)
            {
                return fallback;
            }

            var parsed = questionsElement.EnumerateArray()
                .Select(x => new GeneratedQuestion
                {
                    Text = x.TryGetProperty("text", out var textEl) ? textEl.GetString() : null,
                    Type = x.TryGetProperty("type", out var typeEl) ? typeEl.GetString() : "open",
                    RelatedGoal = x.TryGetProperty("relatedGoal", out var goalEl) ? goalEl.GetString() : null,
                    Category = x.TryGetProperty("category", out var categoryEl) ? categoryEl.GetString() : null,
                })
                .Where(x => !string.IsNullOrWhiteSpace(x.Text))
                .Take(3)
                .ToList();

            return parsed.Count == 0 ? fallback : parsed;
        }
        catch
        {
            return fallback;
        }
    }

    private async Task<GeneratedFeedback> GenerateFeedback(
        Project project,
        List<string> projectSkills,
        List<ProjectTask> tasks,
        int memberCount)
    {
        var fallback = new GeneratedFeedback
        {
            Summary = $"Team completed {project.Title} with {memberCount} contributors and {tasks.Count(x => x.Status == ProjectTaskStatus.Done)} completed tasks.",
            Strengths = new List<string>
            {
                "Collaboration across team members",
                "Consistent contribution toward project goals",
                "Delivery of defined project tasks",
            },
            ImprovementAreas = new List<string>
            {
                "Earlier alignment on unclear requirements",
                "More proactive feedback loops during delivery",
            },
            Tips = new List<string>
            {
                "Run short retrospectives after each milestone.",
                "Pair teammates with complementary skills.",
                "Document decisions in one shared channel.",
            },
            GrowthScore = 72,
        };

        if (!_groqChatService.IsConfigured())
        {
            return fallback;
        }

        var payload = new
        {
            project = new
            {
                project.Title,
                project.Description,
                skills = projectSkills,
                memberCount,
                completedTasks = tasks.Count(x => x.Status == ProjectTaskStatus.Done),
                totalTasks = tasks.Count,
            },
        };

        var systemPrompt = "Return JSON: {\"summary\":\"\",\"strengths\":[\"\"],\"improvementAreas\":[\"\"],\"tips\":[\"\"],\"growthScore\":0}. growthScore must be 0-100.";
        var response = await _groqChatService.TryCompleteAsync(systemPrompt, JsonSerializer.Serialize(payload));
        if (string.IsNullOrWhiteSpace(response))
        {
            return fallback;
        }

        try
        {
            using var document = JsonDocument.Parse(response);
            return new GeneratedFeedback
            {
                Summary = document.RootElement.TryGetProperty("summary", out var summaryEl)
                    ? summaryEl.GetString()
                    : fallback.Summary,
                Strengths = ReadStringArray(document.RootElement, "strengths", fallback.Strengths),
                ImprovementAreas = ReadStringArray(document.RootElement, "improvementAreas", fallback.ImprovementAreas),
                Tips = ReadStringArray(document.RootElement, "tips", fallback.Tips),
                GrowthScore = ClampGrowthScore(document.RootElement.TryGetProperty("growthScore", out var scoreEl)
                    ? scoreEl.GetInt32()
                    : fallback.GrowthScore),
            };
        }
        catch
        {
            return fallback;
        }
    }

    private static List<string> ReadStringArray(JsonElement root, string property, List<string> fallback)
    {
        if (!root.TryGetProperty(property, out var element) || element.ValueKind != JsonValueKind.Array)
        {
            return fallback;
        }

        var values = element.EnumerateArray()
            .Select(x => x.GetString())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToList();

        return values.Count == 0 ? fallback : values;
    }

    private static int ClampGrowthScore(int score)
    {
        return Math.Max(0, Math.Min(100, score));
    }

    private async Task<List<string>> GetSkills(Guid developerId)
    {
        var profile = await _developerProfileRepository.GetAll()
            .FirstOrDefaultAsync(x => x.DeveloperId == developerId);
        if (profile == null)
        {
            return new List<string>();
        }

        return await _developerProfileSkillRepository.GetAll()
            .Where(x => x.ProfileId == profile.Id)
            .Select(x => x.Name)
            .ToListAsync();
    }

    private async Task<List<string>> GetGoals(Guid developerId)
    {
        var profile = await _developerProfileRepository.GetAll()
            .FirstOrDefaultAsync(x => x.DeveloperId == developerId);
        if (profile == null)
        {
            return new List<string>();
        }

        return await _developerProfileGoalRepository.GetAll()
            .Where(x => x.ProfileId == profile.Id)
            .Select(x => x.Goal)
            .ToListAsync();
    }

    private class GeneratedQuestion
    {
        public string Text { get; set; }
        public string Type { get; set; }
        public string RelatedGoal { get; set; }
        public string Category { get; set; }
    }

    private class GeneratedFeedback
    {
        public string Summary { get; set; }
        public List<string> Strengths { get; set; } = new List<string>();
        public List<string> ImprovementAreas { get; set; } = new List<string>();
        public List<string> Tips { get; set; } = new List<string>();
        public int GrowthScore { get; set; }
    }
}
