using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.AiService;
using MosaicTalent.Services.DeveloperOnboardingService.DTO;
using MosaicTalent.Services.GamificationService;
using MosaicTalent.Services.GamificationService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperOnboardingService;

public partial class DeveloperOnboardingAppService
{
    public async Task<DeveloperOnboardingDto> GetMyProfile()
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var user = await _userRepository.FirstOrDefaultAsync(userId);

        var developer = await _developerRepository.GetAll()
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (developer == null)
        {
            return new DeveloperOnboardingDto
            {
                UserId = userId,
                FullName = string.Join(" ", new[] { user?.Name, user?.Surname }.Where(x => !string.IsNullOrWhiteSpace(x))),
                EmailAddress = user?.EmailAddress,
            };
        }

        var profile = await _profileRepository.GetAll()
            .FirstOrDefaultAsync(x => x.DeveloperId == developer.Id);

        var tenantId = AbpSession.TenantId;
        if (profile != null)
        {
            await _teamworkRatingService.RecalculateForDeveloperAsync(tenantId, developer.Id);
            profile = await _profileRepository.GetAll()
                .FirstOrDefaultAsync(x => x.DeveloperId == developer.Id);
        }

        var skills = profile == null
            ? new List<string>()
            : await _profileSkillRepository.GetAll()
                .Where(x => x.ProfileId == profile.Id)
                .Select(x => x.Name)
                .ToListAsync();

        var goals = profile == null
            ? new List<string>()
            : await _profileGoalRepository.GetAll()
                .Where(x => x.ProfileId == profile.Id)
                .Select(x => x.Goal)
                .ToListAsync();

        return new DeveloperOnboardingDto
        {
            UserId = userId,
            FullName = string.Join(" ", new[] { user?.Name, user?.Surname }.Where(x => !string.IsNullOrWhiteSpace(x))),
            EmailAddress = user?.EmailAddress,
            HasCompletedOnboarding = profile?.HasCompletedOnboarding ?? false,
            OnboardingStep = profile?.OnboardingStep ?? 0,
            GithubUsername = developer.GithubUsername,
            AvatarUrl = string.IsNullOrWhiteSpace(user?.AvatarUrl) && !string.IsNullOrWhiteSpace(developer.GithubUsername)
                ? $"https://github.com/{developer.GithubUsername}.png"
                : user?.AvatarUrl,
            YearsOfExperience = developer.YearsOfExperience,
            YearOfStudy = developer.YearOfStudy,
            StudyLevel = developer.StudyLevel,
            Bio = profile?.Bio,
            Location = profile?.Location,
            TeamworkRating = profile?.TeamworkRating ?? 0,
            Skills = skills,
            Goals = goals,
        };
    }

    public async Task<List<StudyLevelOptionDto>> GetStudyLevels()
    {
        return Enum.GetValues<StudyLevel>()
            .Select(x => new StudyLevelOptionDto
            {
                Value = (int)x,
                Label = x.ToString(),
            })
            .ToList();
    }

    public async Task<DeveloperGamificationSummaryDto> GetMyGamificationSummary()
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");

        var developer = await _developerRepository.GetAll()
            .FirstOrDefaultAsync(x => x.UserId == userId);
        if (developer == null)
        {
            return new DeveloperGamificationSummaryDto();
        }

        return await _developerGamificationService.GetSummaryAsync(tenantId, developer.Id);
    }

}
