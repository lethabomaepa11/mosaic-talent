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

[AbpAuthorize]
public partial class DeveloperOnboardingAppService : MosaicTalentAppServiceBase, IDeveloperOnboardingAppService
{
    private readonly IRepository<Developer, Guid> _developerRepository;
    private readonly IRepository<DeveloperProfile, Guid> _profileRepository;
    private readonly IRepository<DeveloperProfileSkill, Guid> _profileSkillRepository;
    private readonly IRepository<DeveloperProfileGoal, Guid> _profileGoalRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly IRepository<Project, Guid> _projectRepository;
    private readonly IRepository<ProjectMember, Guid> _projectMemberRepository;
    private readonly IRepository<ProjectSkill, Guid> _projectSkillRepository;
    private readonly IGroqChatService _groqChatService;
    private readonly IDeveloperGamificationService _developerGamificationService;

    public DeveloperOnboardingAppService(
        IRepository<Developer, Guid> developerRepository,
        IRepository<DeveloperProfile, Guid> profileRepository,
        IRepository<DeveloperProfileSkill, Guid> profileSkillRepository,
        IRepository<DeveloperProfileGoal, Guid> profileGoalRepository,
        IRepository<User, long> userRepository,
        IRepository<Project, Guid> projectRepository,
        IRepository<ProjectMember, Guid> projectMemberRepository,
        IRepository<ProjectSkill, Guid> projectSkillRepository,
        IGroqChatService groqChatService,
        IDeveloperGamificationService developerGamificationService)
    {
        _developerRepository = developerRepository;
        _profileRepository = profileRepository;
        _profileSkillRepository = profileSkillRepository;
        _profileGoalRepository = profileGoalRepository;
        _userRepository = userRepository;
        _projectRepository = projectRepository;
        _projectMemberRepository = projectMemberRepository;
        _projectSkillRepository = projectSkillRepository;
        _groqChatService = groqChatService;
        _developerGamificationService = developerGamificationService;
    }

    [AbpAllowAnonymous]
    public async Task<DeveloperPublicProfileDto> GetPublicProfile(GetPublicDeveloperProfileInput input)
    {
        var requestedUserName = (input?.UserName ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(requestedUserName))
        {
            throw new UserFriendlyException("Username is required.");
        }

        var normalizedUserName = requestedUserName.ToLowerInvariant();
        var user = await _userRepository.GetAll()
            .FirstOrDefaultAsync(x => (x.UserName ?? string.Empty).ToLower() == normalizedUserName);

        Developer developer = null;
        if (user != null)
        {
            developer = await _developerRepository.GetAll()
                .FirstOrDefaultAsync(x => x.UserId == user.Id);
        }

        if (developer == null)
        {
            developer = await _developerRepository.GetAll()
                .FirstOrDefaultAsync(x => (x.GithubUsername ?? string.Empty).ToLower() == normalizedUserName);

            if (developer != null)
            {
                user = await _userRepository.FirstOrDefaultAsync(developer.UserId);
            }
        }

        if (developer == null || user == null)
        {
            return null;
        }

        var profile = await _profileRepository.GetAll()
            .FirstOrDefaultAsync(x => x.DeveloperId == developer.Id);

        var skills = profile == null
            ? new List<string>()
            : await _profileSkillRepository.GetAll()
                .Where(x => x.ProfileId == profile.Id)
                .Select(x => x.Name)
                .ToListAsync();

        var memberProjectIds = await _projectMemberRepository.GetAll()
            .Where(x => x.DeveloperId == developer.Id)
            .Select(x => x.ProjectId)
            .Distinct()
            .ToListAsync();

        var projects = memberProjectIds.Count == 0
            ? new List<Project>()
            : await _projectRepository.GetAll()
                .Where(x => memberProjectIds.Contains(x.Id))
                .OrderByDescending(x => x.CreationTime)
                .ToListAsync();

        var projectIds = projects.Select(x => x.Id).ToList();
        var projectSkills = projectIds.Count == 0
            ? new List<ProjectSkill>()
            : await _projectSkillRepository.GetAll()
                .Where(x => projectIds.Contains(x.ProjectId))
                .ToListAsync();

        var mappedProjects = projects
            .Select(project => new DeveloperPublicProjectDto
            {
                Id = project.Id,
                Title = project.Title,
                Description = project.Description,
                Status = ToPublicProjectStatus(project.Status),
                GithubRepo = project.GithubRepo,
                CreatedAt = project.CreationTime,
                Skills = projectSkills
                    .Where(x => x.ProjectId == project.Id)
                    .Select(x => x.Name)
                    .ToList(),
            })
            .ToList();

        var displayName = string.Join(" ", new[] { user.Name, user.Surname }.Where(x => !string.IsNullOrWhiteSpace(x)));

        return new DeveloperPublicProfileDto
        {
            UserName = user.UserName ?? developer.GithubUsername ?? string.Empty,
            DisplayName = string.IsNullOrWhiteSpace(displayName) ? user.UserName : displayName,
            AvatarUrl = string.IsNullOrWhiteSpace(user.AvatarUrl) && !string.IsNullOrWhiteSpace(developer.GithubUsername)
                ? $"https://github.com/{developer.GithubUsername}.png"
                : user.AvatarUrl,
            GithubUsername = developer.GithubUsername,
            YearsOfExperience = developer.YearsOfExperience,
            YearOfStudy = developer.YearOfStudy,
            StudyLevel = developer.StudyLevel,
            Bio = profile?.Bio,
            Location = profile?.Location,
            TeamworkRating = profile?.TeamworkRating ?? 0,
            Skills = skills,
            CurrentProjects = mappedProjects
                .Where(x => !string.Equals(x.Status, "completed", StringComparison.OrdinalIgnoreCase))
                .ToList(),
            CompletedProjects = mappedProjects
                .Where(x => string.Equals(x.Status, "completed", StringComparison.OrdinalIgnoreCase))
                .ToList(),
        };
    }

    [AbpAllowAnonymous]
    [HttpGet]
    public async Task<List<DeveloperSearchResultDto>> SearchPublicDevelopers(
        GetPublicDeveloperSearchResultsInput input)
    {
        var queryText = (input?.Query ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(queryText))
        {
            return new List<DeveloperSearchResultDto>();
        }

        var normalized = queryText.ToLowerInvariant();

        var skillDeveloperIds = await _profileSkillRepository.GetAll()
            .Where(skill => skill.Name != null && skill.Name.ToLower().Contains(normalized))
            .Join(_profileRepository.GetAll(), skill => skill.ProfileId, profile => profile.Id,
                (_, profile) => profile.DeveloperId)
            .Distinct()
            .ToListAsync();

        var query = from developer in _developerRepository.GetAll()
                    join user in _userRepository.GetAll() on developer.UserId equals user.Id
                    join profile in _profileRepository.GetAll() on developer.Id equals profile.DeveloperId into profileJoin
                    from profile in profileJoin.DefaultIfEmpty()
                    select new
                    {
                        Developer = developer,
                        User = user,
                        ProfileId = profile == null ? (Guid?)null : profile.Id,
                    };

        query = query.Where(item =>
            (item.User.UserName ?? string.Empty).ToLower().Contains(normalized) ||
            (item.User.Name ?? string.Empty).ToLower().Contains(normalized) ||
            (item.User.Surname ?? string.Empty).ToLower().Contains(normalized) ||
            (item.Developer.GithubUsername ?? string.Empty).ToLower().Contains(normalized) ||
            skillDeveloperIds.Contains(item.Developer.Id));

        var developers = await query
            .OrderByDescending(item => item.User.CreationTime)
            .Take(Math.Max(input?.MaxResults ?? 6, 6))
            .ToListAsync();

        var profileIds = developers
            .Where(item => item.ProfileId.HasValue)
            .Select(item => item.ProfileId!.Value)
            .ToList();

        var skills = profileIds.Count == 0
            ? new List<DeveloperProfileSkill>()
            : await _profileSkillRepository.GetAll()
                .Where(skill => profileIds.Contains(skill.ProfileId))
                .ToListAsync();

        var skillLookup = skills
            .GroupBy(skill => skill.ProfileId)
            .ToDictionary(group => group.Key, group => group.Select(skill => skill.Name).Distinct(StringComparer.OrdinalIgnoreCase).Take(3).ToList());

        var results = developers
            .Select(item =>
            {
                var displayName = string.Join(" ", new[] { item.User.Name, item.User.Surname }.Where(x => !string.IsNullOrWhiteSpace(x)));
                var skillTags = item.ProfileId.HasValue && skillLookup.TryGetValue(item.ProfileId.Value, out var tags)
                    ? tags
                    : new List<string>();

                return new
                {
                    Item = item,
                    Score =
                        ((item.User.UserName ?? string.Empty).ToLower().Contains(normalized) ? 4 : 0) +
                        ((item.User.Name ?? string.Empty).ToLower().Contains(normalized) ? 3 : 0) +
                        ((item.User.Surname ?? string.Empty).ToLower().Contains(normalized) ? 2 : 0) +
                        ((item.Developer.GithubUsername ?? string.Empty).ToLower().Contains(normalized) ? 2 : 0) +
                        (skillDeveloperIds.Contains(item.Developer.Id) ? 1 : 0)
                };
            })
            .OrderByDescending(x => x.Score)
            .ThenByDescending(x => x.Item.User.CreationTime)
            .Take(Math.Max(input?.MaxResults ?? 6, 6))
            .Select(x =>
            {
                var displayName = string.Join(" ", new[] { x.Item.User.Name, x.Item.User.Surname }.Where(value => !string.IsNullOrWhiteSpace(value)));
                return new DeveloperSearchResultDto
                {
                    UserName = x.Item.User.UserName ?? string.Empty,
                    DisplayName = string.IsNullOrWhiteSpace(displayName) ? x.Item.User.UserName ?? string.Empty : displayName,
                    AvatarUrl = string.IsNullOrWhiteSpace(x.Item.User.AvatarUrl)
                        && !string.IsNullOrWhiteSpace(x.Item.Developer.GithubUsername)
                        ? $"https://github.com/{x.Item.Developer.GithubUsername}.png"
                        : x.Item.User.AvatarUrl,
                    GithubUsername = x.Item.Developer.GithubUsername,
                    YearsOfExperience = x.Item.Developer.YearsOfExperience,
                    SkillTags = x.Item.ProfileId.HasValue && skillLookup.TryGetValue(x.Item.ProfileId.Value, out var tags) ? tags : Enumerable.Empty<string>(),
                };
            })
            .ToList();

        return results;
    }

    public async Task<DeveloperOnboardingDto> GetMyProfile()
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var user = await _userRepository.FirstOrDefaultAsync(userId);

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

    public async Task<DeveloperOnboardingDto> UpsertMyProfile(UpsertDeveloperOnboardingInput input)
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var user = await _userRepository.FirstOrDefaultAsync(userId)
            ?? throw new UserFriendlyException("User must be logged in.");

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
            developer.YearsOfExperience = input.YearsOfExperience;
            developer.YearOfStudy = input.YearOfStudy;
            developer.StudyLevel = input.StudyLevel;

            await _developerRepository.UpdateAsync(developer);
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

    private static string ToPublicProjectStatus(ProjectStatus status)
    {
        return status switch
        {
            ProjectStatus.Draft => "draft",
            ProjectStatus.InProgress => "in-progress",
            ProjectStatus.Complete => "completed",
            _ => "open",
        };
    }
}
