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
    public async Task<DeveloperOnboardingDto> UpsertMyProfile(UpsertDeveloperOnboardingInput input)
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var user = await _userRepository.FirstOrDefaultAsync(userId)
            ?? throw new UserFriendlyException("User must be logged in.");
        if (input.CompleteOnboarding && (!(input.Skills?.Any(x => !string.IsNullOrWhiteSpace(x)) ?? false)
            || string.IsNullOrWhiteSpace(user.Name) || string.IsNullOrWhiteSpace(user.EmailAddress)))
        {
            throw new UserFriendlyException("Complete your account details and add at least one skill before continuing.");
        }

        if (input.YearOfStudy.HasValue && input.YearOfStudy.Value >= 10)
        {
            throw new UserFriendlyException("Year of study must be less than 10.");
        }

        var developer = await _developerRepository.GetAll()
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (developer == null)
        {
            developer = new Developer
            {
                UserId = userId,
                GithubUsername = null,
                YearsOfExperience = input.YearsOfExperience,
                YearOfStudy = input.YearOfStudy,
                StudyLevel = input.StudyLevel,
            };

            await _developerRepository.InsertAsync(developer);
            await CurrentUnitOfWork.SaveChangesAsync();
        }
        else
        {
            // Identity is set only by an authenticated GitHub OAuth connection.
            developer.YearsOfExperience = input.YearsOfExperience;
            developer.YearOfStudy = input.YearOfStudy;
            developer.StudyLevel = input.StudyLevel;

            await _developerRepository.UpdateAsync(developer);
        }

        var existingProfile = await _profileRepository.GetAll().FirstOrDefaultAsync(x => x.DeveloperId == developer.Id);
        if (existingProfile?.HasCompletedOnboarding == true && !(input.Skills?.Any(x => !string.IsNullOrWhiteSpace(x)) ?? false))
        {
            throw new UserFriendlyException("Keep at least one skill in your profile.");
        }

        user.AvatarUrl = input.AvatarUrl;
        await _userRepository.UpdateAsync(user);

        var profile = await _profileRepository.GetAll()
            .FirstOrDefaultAsync(x => x.DeveloperId == developer.Id);

        if (profile == null)
        {
            profile = new DeveloperProfile
            {
                DeveloperId = developer.Id,
                Bio = input.Bio,
                Location = input.Location,
                TeamworkRating = 0,
            };
            await _profileRepository.InsertAsync(profile);
            await CurrentUnitOfWork.SaveChangesAsync();
        }
        else
        {
            profile.Bio = input.Bio;
            profile.Location = input.Location;
            await _profileRepository.UpdateAsync(profile);
        }

        profile.HasCompletedOnboarding = profile.HasCompletedOnboarding || input.CompleteOnboarding;
        profile.OnboardingStep = input.CompleteOnboarding ? 3 : input.OnboardingStep;
        await _profileRepository.UpdateAsync(profile);

        var normalizedSkills = (input.Skills ?? new List<string>())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var normalizedGoals = (input.Goals ?? new List<string>())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        using (CurrentUnitOfWork.DisableFilter(AbpDataFilters.SoftDelete))
        {
            var allSkills = await _profileSkillRepository.GetAll()
                .Where(x => x.ProfileId == profile.Id)
                .ToListAsync();
            var skillLookup = normalizedSkills.ToDictionary(x => x, x => x, StringComparer.OrdinalIgnoreCase);

            foreach (var skillRow in allSkills)
            {
                if (skillLookup.TryGetValue(skillRow.Name, out var normalizedName))
                {
                    if (skillRow.IsDeleted || !string.Equals(skillRow.Name, normalizedName, StringComparison.Ordinal))
                    {
                        skillRow.IsDeleted = false;
                        skillRow.DeleterUserId = null;
                        skillRow.DeletionTime = null;
                        skillRow.Name = normalizedName;
                        await _profileSkillRepository.UpdateAsync(skillRow);
                    }

                    skillLookup.Remove(normalizedName);
                }
                else if (!skillRow.IsDeleted)
                {
                    await _profileSkillRepository.DeleteAsync(skillRow);
                }
            }

            foreach (var skill in skillLookup.Values)
            {
                await _profileSkillRepository.InsertAsync(new DeveloperProfileSkill
                {
                    ProfileId = profile.Id,
                    Name = skill,
                });
            }

            var allGoals = await _profileGoalRepository.GetAll()
                .Where(x => x.ProfileId == profile.Id)
                .ToListAsync();
            var goalLookup = normalizedGoals.ToDictionary(x => x, x => x, StringComparer.OrdinalIgnoreCase);

            foreach (var goalRow in allGoals)
            {
                if (goalLookup.TryGetValue(goalRow.Goal, out var normalizedGoal))
                {
                    if (goalRow.IsDeleted || !string.Equals(goalRow.Goal, normalizedGoal, StringComparison.Ordinal))
                    {
                        goalRow.IsDeleted = false;
                        goalRow.DeleterUserId = null;
                        goalRow.DeletionTime = null;
                        goalRow.Goal = normalizedGoal;
                        await _profileGoalRepository.UpdateAsync(goalRow);
                    }

                    goalLookup.Remove(normalizedGoal);
                }
                else if (!goalRow.IsDeleted)
                {
                    await _profileGoalRepository.DeleteAsync(goalRow);
                }
            }

            foreach (var goal in goalLookup.Values)
            {
                await _profileGoalRepository.InsertAsync(new DeveloperProfileGoal
                {
                    ProfileId = profile.Id,
                    Goal = goal,
                });
            }
        }

        await CurrentUnitOfWork.SaveChangesAsync();

        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        await _teamworkRatingService.RecalculateForDeveloperAsync(tenantId, developer.Id);

        return await GetMyProfile();
    }

}
