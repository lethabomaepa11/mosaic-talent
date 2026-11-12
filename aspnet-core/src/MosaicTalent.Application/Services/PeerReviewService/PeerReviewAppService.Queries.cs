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

public partial class PeerReviewAppService
{
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
                        Text = PeerReviewQuestionText.Sanitize(question.Text, project.Title, reviewerKnownName, revieweeKnownName),
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

}
