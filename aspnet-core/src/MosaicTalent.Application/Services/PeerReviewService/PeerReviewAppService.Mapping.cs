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
                Text = PeerReviewQuestionText.Sanitize(
                    question.Text, project.Title,
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

}
