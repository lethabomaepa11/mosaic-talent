using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Notifications;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Domains.Reviews;
using MosaicTalent.Services.GamificationService;
using MosaicTalent.Services.GamificationService.DTO;
using MosaicTalent.Services.DeveloperOnboardingService;
using MosaicTalent.Services.NotificationChannelService;
using MosaicTalent.Services.PeerReviewService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace MosaicTalent.Services.PeerReviewService;

[AbpAuthorize]
public class PeerReviewAppService : MosaicTalentAppServiceBase, IPeerReviewAppService
{
    private const string AnonymousDisplayName = "Anonymous teammate";
    private readonly IRepository<Developer, Guid> _developerRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly IRepository<Project, Guid> _projectRepository;
    private readonly IRepository<ProjectMember, Guid> _projectMemberRepository;
    private readonly IRepository<PeerReview, Guid> _peerReviewRepository;
    private readonly IRepository<AIReviewQuestion, Guid> _questionRepository;
    private readonly IRepository<ReviewAnswer, Guid> _answerRepository;
    private readonly IRepository<AIReviewFeedback, Guid> _feedbackRepository;
    private readonly IPeerReviewGenerationService _generationService;
    private readonly INotificationEventDispatcher _notificationEventDispatcher;
    private readonly IDeveloperGamificationService _developerGamificationService;
    private readonly ITeamworkRatingService _teamworkRatingService;

    public PeerReviewAppService(
        IRepository<Developer, Guid> developerRepository,
        IRepository<User, long> userRepository,
        IRepository<Project, Guid> projectRepository,
        IRepository<ProjectMember, Guid> projectMemberRepository,
        IRepository<PeerReview, Guid> peerReviewRepository,
        IRepository<AIReviewQuestion, Guid> questionRepository,
        IRepository<ReviewAnswer, Guid> answerRepository,
        IRepository<AIReviewFeedback, Guid> feedbackRepository,
        IPeerReviewGenerationService generationService,
        INotificationEventDispatcher notificationEventDispatcher,
        IDeveloperGamificationService developerGamificationService,
        ITeamworkRatingService teamworkRatingService)
    {
        _developerRepository = developerRepository;
        _userRepository = userRepository;
        _projectRepository = projectRepository;
        _projectMemberRepository = projectMemberRepository;
        _peerReviewRepository = peerReviewRepository;
        _questionRepository = questionRepository;
        _answerRepository = answerRepository;
        _feedbackRepository = feedbackRepository;
        _generationService = generationService;
        _notificationEventDispatcher = notificationEventDispatcher;
        _developerGamificationService = developerGamificationService;
        _teamworkRatingService = teamworkRatingService;
    }

    public async Task<List<ProjectPeerReviewsDto>> GetMyProjectPeerReviews()
    {
        var developer = await GetCurrentDeveloper();
        var projectIds = await _projectMemberRepository.GetAll()
            .Where(x => x.DeveloperId == developer.Id)
            .Select(x => x.ProjectId)
            .Distinct()
            .ToListAsync();

        if (projectIds.Count == 0)
        {
            return new List<ProjectPeerReviewsDto>();
        }

        var assignedProjectIds = await _peerReviewRepository.GetAll()
            .Where(x => x.ReviewerDeveloperId == developer.Id)
            .Select(x => x.ProjectId)
            .Distinct()
            .ToListAsync();

        var projects = await _projectRepository.GetAll()
            .Where(x => projectIds.Contains(x.Id) &&
                (x.Status == ProjectStatus.Complete || assignedProjectIds.Contains(x.Id)))
            .OrderByDescending(x => x.LastModificationTime ?? x.CreationTime)
            .ToListAsync();

        var result = new List<ProjectPeerReviewsDto>();
        foreach (var project in projects)
        {
            var tenantId = project.TenantId;
            await _generationService.EnsureGeneratedForProject(project.Id, tenantId);
            result.Add(await BuildProjectReviews(project.Id, developer.Id));
        }

        return result;
    }

    public async Task<ProjectPeerReviewsDto> GetProjectPeerReviews(GetProjectPeerReviewsInput input)
    {
        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        await _generationService.EnsureGeneratedForProject(project.Id, project.TenantId);
        return await BuildProjectReviews(project.Id, developer.Id);
    }

    public async Task<ProjectPeerReviewsDto> GenerateProjectPeerReviews(GenerateProjectPeerReviewsInput input)
    {
        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        await _generationService.EnsureGeneratedForProject(project.Id, project.TenantId);
        return await BuildProjectReviews(project.Id, developer.Id);
    }

    public async Task<ProjectPeerReviewsDto> RequestProjectPeerReview(GenerateProjectPeerReviewsInput input)
    {
        var developer = await GetCurrentDeveloper();
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        await _generationService.RequestPeerReviewFromTeammates(project.Id, tenantId, developer.Id);
        return await BuildProjectReviews(project.Id, developer.Id);
    }

    public async Task<PeerReviewDto> SetPeerReviewRating(SetPeerReviewRatingInput input)
    {
        var developer = await GetCurrentDeveloper();
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var review = await _peerReviewRepository.FirstOrDefaultAsync(input.ReviewId)
            ?? throw new UserFriendlyException("Peer review not found.");

        await EnsureProjectMember(review.ProjectId, developer.Id);
        if (review.ReviewerDeveloperId != developer.Id)
        {
            throw new UserFriendlyException("Only the assigned reviewer can rate this review.");
        }

        review.Rating = Math.Max(1, Math.Min(10, input.Rating));
        await _peerReviewRepository.UpdateAsync(review);
        await CurrentUnitOfWork.SaveChangesAsync();
        await _teamworkRatingService.RecalculateForDeveloperAsync(tenantId, review.RevieweeDeveloperId);

        var dto = await BuildPeerReviewDto(review);
        dto.GamificationReward = await _developerGamificationService.AwardAsync(
            tenantId,
            developer.Id,
            "peer_review_rating",
            $"peer-review-rating:{review.Id}",
            $"project:{review.ProjectId}");
        return dto;
    }

    public async Task<PeerReviewQuestionDto> SubmitReviewAnswer(SubmitReviewAnswerInput input)
    {
        var developer = await GetCurrentDeveloper();
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var question = await _questionRepository.FirstOrDefaultAsync(input.QuestionId)
            ?? throw new UserFriendlyException("Review question not found.");
        var review = await _peerReviewRepository.FirstOrDefaultAsync(question.PeerReviewId)
            ?? throw new UserFriendlyException("Peer review not found.");

        await EnsureProjectMember(review.ProjectId, developer.Id);
        if (review.ReviewerDeveloperId != developer.Id)
        {
            throw new UserFriendlyException("Only the assigned reviewer can answer this question.");
        }

        var normalized = (input.Text ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new UserFriendlyException("Answer text is required.");
        }

        var reviewQuestionIds = await _questionRepository.GetAll()
            .Where(x => x.PeerReviewId == review.Id)
            .Select(x => x.Id)
            .ToListAsync();
        var answeredBeforeIds = reviewQuestionIds.Count == 0
            ? new HashSet<Guid>()
            : (await _answerRepository.GetAll()
                .Where(x => reviewQuestionIds.Contains(x.AIReviewQuestionId) && !string.IsNullOrWhiteSpace(x.Text))
                .Select(x => x.AIReviewQuestionId)
                .ToListAsync()).ToHashSet();
        var wasComplete = reviewQuestionIds.Count > 0 && reviewQuestionIds.All(answeredBeforeIds.Contains);

        var existingAnswer = await _answerRepository.GetAll()
            .FirstOrDefaultAsync(x => x.AIReviewQuestionId == question.Id);
        var hadAnswerBefore = existingAnswer != null && !string.IsNullOrWhiteSpace(existingAnswer.Text);

        if (existingAnswer == null)
        {
            await _answerRepository.InsertAsync(new ReviewAnswer
            {
                TenantId = tenantId,
                AIReviewQuestionId = question.Id,
                Text = normalized,
            });
        }
        else
        {
            existingAnswer.Text = normalized;
            await _answerRepository.UpdateAsync(existingAnswer);
        }

        await CurrentUnitOfWork.SaveChangesAsync();

        var answeredAfterIds = new HashSet<Guid>(answeredBeforeIds);
        if (!hadAnswerBefore)
        {
            answeredAfterIds.Add(question.Id);
        }
        var isComplete = reviewQuestionIds.Count > 0 && reviewQuestionIds.All(answeredAfterIds.Contains);
        GamificationRewardDto reviewerReward = null;

        if (!wasComplete && isComplete)
        {
            reviewerReward = await _developerGamificationService.AwardAsync(
                tenantId,
                developer.Id,
                "peer_review_completed",
                $"peer-review-completed:{review.Id}",
                $"project:{review.ProjectId}");

            try
            {
                var reviewee = await _developerRepository.FirstOrDefaultAsync(review.RevieweeDeveloperId);
                if (reviewee != null && reviewee.UserId > 0)
                {
                    await _developerGamificationService.AwardAsync(
                        tenantId,
                        reviewee.Id,
                        "peer_review_received",
                        $"peer-review-received:{review.Id}",
                        $"project:{review.ProjectId}");

                    var project = await _projectRepository.FirstOrDefaultAsync(review.ProjectId);
                    var title = project?.Title ?? "your project";
                    var message = $"A teammate completed your peer review for \"{title}\".";
                    await _notificationEventDispatcher.NotifyUsersAsync(
                        review.TenantId,
                        new[] { reviewee.UserId },
                        "MosaicTalent.PeerReviewCompleted",
                        message,
                        NotificationSeverity.Info,
                        "/app/reviews",
                        "Peer review complete",
                        message);
                }
            }
            catch (Exception ex)
            {
                Logger.Warn("Failed to dispatch peer review completion notification.", ex);
            }
        }

        return new PeerReviewQuestionDto
        {
            Id = question.Id,
            Text = question.Text,
            Type = question.Type,
            RelatedGoal = question.RelatedGoal,
            Category = question.Category,
            AnswerText = normalized,
            GamificationReward = reviewerReward,
        };
    }

    private async Task<Developer> GetCurrentDeveloper()
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var developer = await _developerRepository.GetAll()
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (developer == null)
        {
            throw new UserFriendlyException("Developer profile not found.");
        }

        return developer;
    }

    private async Task<Project> EnsureProjectMember(Guid projectId, Guid developerId)
    {
        var project = await _projectRepository.FirstOrDefaultAsync(projectId)
            ?? throw new UserFriendlyException("Project not found.");

        var isMember = await _projectMemberRepository.GetAll()
            .AnyAsync(x => x.ProjectId == projectId && x.DeveloperId == developerId);
        if (!isMember)
        {
            throw new UserFriendlyException("You are not a member of this project.");
        }

        return project;
    }

    private async Task<ProjectPeerReviewsDto> BuildProjectReviews(Guid projectId, Guid currentDeveloperId)
    {
        var project = await _projectRepository.FirstOrDefaultAsync(projectId)
            ?? throw new UserFriendlyException("Project not found.");

        var reviews = await _peerReviewRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .OrderBy(x => x.CreationTime)
            .ToListAsync();
        var reviewIds = reviews.Select(x => x.Id).ToList();

        var questions = reviewIds.Count == 0
            ? new List<AIReviewQuestion>()
            : await _questionRepository.GetAll()
                .Where(x => reviewIds.Contains(x.PeerReviewId))
                .OrderBy(x => x.CreationTime)
                .ToListAsync();

        var questionIds = questions.Select(x => x.Id).ToList();
        var answers = questionIds.Count == 0
            ? new List<ReviewAnswer>()
            : await _answerRepository.GetAll()
                .Where(x => questionIds.Contains(x.AIReviewQuestionId))
                .ToListAsync();
        var feedback = await _feedbackRepository.GetAll()
            .FirstOrDefaultAsync(x => x.ProjectId == projectId);

        var developerIds = reviews
            .SelectMany(x => new[] { x.ReviewerDeveloperId, x.RevieweeDeveloperId })
            .Distinct()
            .ToList();
        var developers = developerIds.Count == 0
            ? new List<Developer>()
            : await _developerRepository.GetAll()
                .Where(x => developerIds.Contains(x.Id))
                .ToListAsync();
        var usersByDeveloper = await BuildUsersByDeveloper(developers);

        var reviewDtos = reviews.Select(review =>
        {
            var reviewerKnownName = usersByDeveloper.TryGetValue(review.ReviewerDeveloperId, out var reviewerNameValue)
                ? reviewerNameValue
                : "Reviewer";
            var revieweeKnownName = usersByDeveloper.TryGetValue(review.RevieweeDeveloperId, out var revieweeNameValue)
                ? revieweeNameValue
                : "Teammate";
            var reviewQuestions = questions
                .Where(x => x.PeerReviewId == review.Id)
                .Select(question =>
                {
                    var answer = answers.FirstOrDefault(x => x.AIReviewQuestionId == question.Id);
                    return new PeerReviewQuestionDto
                    {
                        Id = question.Id,
                        Text = SanitizeQuestionText(question.Text, reviewerKnownName, revieweeKnownName),
                        Type = question.Type,
                        RelatedGoal = question.RelatedGoal,
                        Category = question.Category,
                        AnswerText = answer?.Text,
                    };
                })
                .ToList();

            return new PeerReviewDto
            {
                Id = review.Id,
                ProjectId = review.ProjectId,
                ProjectTitle = project.Title,
                ReviewerDeveloperId = review.ReviewerDeveloperId,
                ReviewerName = AnonymousDisplayName,
                RevieweeDeveloperId = review.RevieweeDeveloperId,
                RevieweeName = AnonymousDisplayName,
                Rating = review.Rating,
                IsCompleted = reviewQuestions.Count > 0 &&
                              reviewQuestions.All(x => !string.IsNullOrWhiteSpace(x.AnswerText)),
                Questions = reviewQuestions,
            };
        }).ToList();

        var dto = new ProjectPeerReviewsDto
        {
            ProjectId = project.Id,
            ProjectTitle = project.Title,
            AssignedToMe = reviewDtos
                .Where(x => x.ReviewerDeveloperId == currentDeveloperId)
                .ToList(),
            ReceivedByMe = reviewDtos
                .Where(x => x.RevieweeDeveloperId == currentDeveloperId)
                .ToList(),
            Feedback = feedback == null
                ? null
                : new AIReviewFeedbackDto
                {
                    Summary = feedback.Summary,
                    Strengths = ParseJsonList(feedback.StrengthsJson),
                    ImprovementAreas = ParseJsonList(feedback.ImprovementAreasJson),
                    Tips = ParseJsonList(feedback.TipsJson),
                    GrowthScore = feedback.GrowthScore,
                },
        };

        dto.ProjectStatus = project.Status switch
        {
            ProjectStatus.Open => "open",
            ProjectStatus.InProgress => "in-progress",
            ProjectStatus.Complete => "completed",
            _ => "draft",
        };

        var membership = await _projectMemberRepository.GetAll()
            .FirstOrDefaultAsync(x => x.ProjectId == projectId && x.DeveloperId == currentDeveloperId);
        var memberCount = await _projectMemberRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .Select(x => x.DeveloperId)
            .Distinct()
            .CountAsync();
        var lastRequest = await _peerReviewRepository.GetAll()
            .Where(x => x.ProjectId == projectId && x.RevieweeDeveloperId == currentDeveloperId && x.IsEarlyRequest)
            .OrderByDescending(x => x.CreationTime)
            .FirstOrDefaultAsync();
        var eligibility = PeerReviewRequestPolicy.Evaluate(
            project.Status,
            membership != null,
            memberCount,
            membership?.CreationTime,
            lastRequest?.CreationTime,
            DateTime.UtcNow);
        dto.CanRequestPeerReview = eligibility.CanRequest;
        dto.PeerReviewRequestMessage = eligibility.Message;

        return dto;
    }

    private async Task<PeerReviewDto> BuildPeerReviewDto(PeerReview review)
    {
        var project = await _projectRepository.FirstOrDefaultAsync(review.ProjectId)
            ?? throw new UserFriendlyException("Project not found.");
        var questions = await _questionRepository.GetAll()
            .Where(x => x.PeerReviewId == review.Id)
            .OrderBy(x => x.CreationTime)
            .ToListAsync();
        var questionIds = questions.Select(x => x.Id).ToList();
        var answers = questionIds.Count == 0
            ? new List<ReviewAnswer>()
            : await _answerRepository.GetAll()
                .Where(x => questionIds.Contains(x.AIReviewQuestionId))
                .ToListAsync();

        var developers = await _developerRepository.GetAll()
            .Where(x => x.Id == review.ReviewerDeveloperId || x.Id == review.RevieweeDeveloperId)
            .ToListAsync();
        var usersByDeveloper = await BuildUsersByDeveloper(developers);

        var questionDtos = questions.Select(question =>
        {
            var answer = answers.FirstOrDefault(x => x.AIReviewQuestionId == question.Id);
            return new PeerReviewQuestionDto
            {
                Id = question.Id,
                Text = SanitizeQuestionText(
                    question.Text,
                    usersByDeveloper.TryGetValue(review.ReviewerDeveloperId, out var reviewerKnownName)
                        ? reviewerKnownName
                        : "Reviewer",
                    usersByDeveloper.TryGetValue(review.RevieweeDeveloperId, out var revieweeKnownName)
                        ? revieweeKnownName
                        : "Teammate"),
                Type = question.Type,
                RelatedGoal = question.RelatedGoal,
                Category = question.Category,
                AnswerText = answer?.Text,
            };
        }).ToList();

        return new PeerReviewDto
        {
            Id = review.Id,
            ProjectId = review.ProjectId,
            ProjectTitle = project.Title,
            ReviewerDeveloperId = review.ReviewerDeveloperId,
            ReviewerName = AnonymousDisplayName,
            RevieweeDeveloperId = review.RevieweeDeveloperId,
            RevieweeName = AnonymousDisplayName,
            Rating = review.Rating,
            IsCompleted = questionDtos.Count > 0 &&
                          questionDtos.All(x => !string.IsNullOrWhiteSpace(x.AnswerText)),
            Questions = questionDtos,
        };
    }

    private async Task<Dictionary<Guid, string>> BuildUsersByDeveloper(List<Developer> developers)
    {
        var userIds = developers.Select(x => x.UserId).Distinct().ToList();
        if (userIds.Count == 0)
        {
            return new Dictionary<Guid, string>();
        }

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

    private static List<string> ParseJsonList(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new List<string>();
        }

        try
        {
            var parsed = JsonSerializer.Deserialize<List<string>>(json);
            return parsed?.Where(x => !string.IsNullOrWhiteSpace(x)).ToList() ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    private static string SanitizeQuestionText(string text, params string[] knownNames)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return text;
        }

        var output = text;
        foreach (var name in ExpandNameVariants(knownNames))
        {
            output = output.Replace(name, "your anonymous teammate", StringComparison.OrdinalIgnoreCase);
        }

        return output;
    }

    private static List<string> ExpandNameVariants(IEnumerable<string> names)
    {
        return names
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .SelectMany(name => new[] { name.Trim() }.Concat(
                name.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                    .Where(part => part.Length > 2)))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
