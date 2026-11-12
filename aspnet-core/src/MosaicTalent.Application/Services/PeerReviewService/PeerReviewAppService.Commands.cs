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

}
