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
