using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Services.DeveloperOnboardingService.DTO;
using MosaicTalent.Domains.Developers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperOnboardingService;

[AbpAuthorize]
public class DeveloperOnboardingAppService : MosaicTalentAppServiceBase, IDeveloperOnboardingAppService
{
    private readonly IRepository<Developer, Guid> _developerRepository;
    private readonly IRepository<DeveloperProfile, Guid> _profileRepository;
    private readonly IRepository<DeveloperProfileSkill, Guid> _profileSkillRepository;
    private readonly IRepository<DeveloperProfileGoal, Guid> _profileGoalRepository;

    public DeveloperOnboardingAppService(
        IRepository<Developer, Guid> developerRepository,
        IRepository<DeveloperProfile, Guid> profileRepository,
        IRepository<DeveloperProfileSkill, Guid> profileSkillRepository,
        IRepository<DeveloperProfileGoal, Guid> profileGoalRepository)
    {
        _developerRepository = developerRepository;
        _profileRepository = profileRepository;
        _profileSkillRepository = profileSkillRepository;
        _profileGoalRepository = profileGoalRepository;
    }

    public async Task<DeveloperOnboardingDto> GetMyProfile()
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");

        var developer = await _developerRepository.GetAll()
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (developer == null)
        {
            return new DeveloperOnboardingDto();
        }

        var profile = await _profileRepository.GetAll()
            .FirstOrDefaultAsync(x => x.DeveloperId == developer.Id);

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
            GithubUsername = developer.GithubUsername,
            AvatarUrl = developer.AvatarUrl,
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

    public async Task<DeveloperOnboardingDto> UpsertMyProfile(UpsertDeveloperOnboardingInput input)
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");

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
                GithubUsername = input.GithubUsername,
                AvatarUrl = input.AvatarUrl,
                YearsOfExperience = input.YearsOfExperience,
                YearOfStudy = input.YearOfStudy,
                StudyLevel = input.StudyLevel,
            };

            await _developerRepository.InsertAsync(developer);
            await CurrentUnitOfWork.SaveChangesAsync();
        }
        else
        {
            developer.GithubUsername = input.GithubUsername;
            developer.AvatarUrl = input.AvatarUrl;
            developer.YearsOfExperience = input.YearsOfExperience;
            developer.YearOfStudy = input.YearOfStudy;
            developer.StudyLevel = input.StudyLevel;

            await _developerRepository.UpdateAsync(developer);
        }

        var profile = await _profileRepository.GetAll()
            .FirstOrDefaultAsync(x => x.DeveloperId == developer.Id);

        if (profile == null)
        {
            profile = new DeveloperProfile
            {
                DeveloperId = developer.Id,
                Bio = input.Bio,
                Location = input.Location,
                TeamworkRating = input.TeamworkRating,
            };
            await _profileRepository.InsertAsync(profile);
            await CurrentUnitOfWork.SaveChangesAsync();
        }
        else
        {
            profile.Bio = input.Bio;
            profile.Location = input.Location;
            profile.TeamworkRating = input.TeamworkRating;
            await _profileRepository.UpdateAsync(profile);
        }

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

        return await GetMyProfile();
    }
}
