using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.BuildJourneyService.DTO;
using MosaicTalent.Services.DeveloperOnboardingService;
using MosaicTalent.Services.DeveloperProjectService;
using MosaicTalent.Services.DeveloperProjectService.DTO;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Services.NotificationChannelService;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MosaicTalent.Services.BuildJourneyService;

[AbpAuthorize]
public partial class BuildJourneyAppService : MosaicTalentAppServiceBase, IBuildJourneyAppService
{
    private readonly IRepository<Developer, Guid> _developers;
    private readonly IRepository<Project, Guid> _projects;
    private readonly IRepository<ProjectTask, Guid> _tasks;
    private readonly IRepository<ProjectMember, Guid> _members;
    private readonly IRepository<ProjectTeamInvite, Guid> _invites;
    private readonly IRepository<ProjectProgressEntry, Guid> _entries;
    private readonly IRepository<ProjectProgressReview, Guid> _reviews;
    private readonly IDeveloperProjectAppService _projectService;
    private readonly IDeveloperOnboardingAppService _profileService;
    private readonly IRepository<User, long> _users;
    private readonly IProjectJoinNotificationDispatcher _inviteNotifications;

    public BuildJourneyAppService(IRepository<Developer, Guid> developers,
        IRepository<Project, Guid> projects, IRepository<ProjectTask, Guid> tasks,
        IRepository<ProjectMember, Guid> members, IRepository<ProjectTeamInvite, Guid> invites,
        IRepository<ProjectProgressEntry, Guid> entries, IRepository<ProjectProgressReview, Guid> reviews,
        IDeveloperProjectAppService projectService, IDeveloperOnboardingAppService profileService,
        IRepository<User, long> users, IProjectJoinNotificationDispatcher inviteNotifications)
    {
        _developers = developers; _projects = projects; _tasks = tasks; _members = members;
        _invites = invites; _entries = entries; _reviews = reviews;
        _projectService = projectService; _profileService = profileService;
        _users = users; _inviteNotifications = inviteNotifications;
    }

    public async Task<BuildHomeDto> GetHome()
    {
        var developer = await CurrentDeveloper();
        var profile = await _profileService.GetMyProfile();
        var mine = await _projectService.GetMyProjects();
        var open = await _projectService.GetOpenProjects();
        return new BuildHomeDto
        {
            DeveloperId = developer.Id, Profile = profile,
            MyProjects = await Enrich(mine, developer.Id),
            OpenProjects = await Enrich(open, developer.Id)
        };
    }

    public async Task<BuildProjectDto> GetBuild(GetDeveloperProjectInput input)
    {
        var developer = await CurrentDeveloper();
        // Keep the established public/private and invitation access policy.
        var project = await _projectService.GetProject(input);
        return (await Enrich(new List<DeveloperProjectDto> { project }, developer.Id)).Single();
    }

    public async Task<List<MyContributionDto>> GetMyContributions()
    {
        var developer = await CurrentDeveloper();
        var entries = await _entries.GetAll().Where(x => x.DeveloperId == developer.Id)
            .OrderByDescending(x => x.CreationTime).Take(100).ToListAsync();
        var projectIds = entries.Select(x => x.ProjectId).Distinct().ToList();
        var projects = await _projects.GetAll().Where(x => projectIds.Contains(x.Id)).ToListAsync();
        var entryIds = entries.Select(x => x.Id).ToList();
        var reviews = await _reviews.GetAll().Where(x => entryIds.Contains(x.EntryId))
            .GroupBy(x => x.EntryId).Select(x => new { Id = x.Key, Count = x.Count() }).ToListAsync();
        return entries.Select(x => new MyContributionDto
        {
            Id = x.Id, ProjectId = x.ProjectId, ProjectTitle = projects.FirstOrDefault(p => p.Id == x.ProjectId)?.Title ?? "Previous project",
            Title = x.Title, Summary = x.Summary, EvidenceUrl = x.EvidenceUrl, CreatedAt = x.CreationTime,
            ReviewCount = reviews.FirstOrDefault(r => r.Id == x.Id)?.Count ?? 0
        }).ToList();
    }

    private async Task<Developer> CurrentDeveloper() =>
        await _developers.GetAll().FirstOrDefaultAsync(x => x.UserId == AbpSession.UserId)
        ?? throw new UserFriendlyException("Complete your developer profile before starting a build.");

    private async Task<List<BuildProjectDto>> Enrich(List<DeveloperProjectDto> summaries, Guid developerId)
    {
        var ids = summaries.Select(x => x.Id).ToList();
        var projects = await _projects.GetAll().Where(x => ids.Contains(x.Id)).ToListAsync();
        var tasks = await _tasks.GetAll().Where(x => ids.Contains(x.ProjectId)).ToListAsync();
        var memberships = await _members.GetAll().Where(x => ids.Contains(x.ProjectId) && x.DeveloperId == developerId).ToListAsync();
        var invites = await _invites.GetAll().Where(x => ids.Contains(x.ProjectId) && x.DeveloperId == developerId && x.Status == ProjectTeamInviteStatus.Pending).ToListAsync();
        return summaries.Select(summary =>
        {
            var project = projects.Single(x => x.Id == summary.Id);
            var membership = memberships.FirstOrDefault(x => x.ProjectId == project.Id);
            return new BuildProjectDto
            {
                Project = summary, Purpose = project.Purpose, FirstOutcome = project.FirstOutcome,
                TeamTimeZone = project.TeamTimeZone, CurrentDeveloperId = developerId,
                IsMember = membership != null,
                CanManage = project.OwnerDeveloperId == developerId || membership?.Role == MemberRole.Lead,
                PendingInviteId = invites.FirstOrDefault(x => x.ProjectId == project.Id)?.Id,
                TaskDetails = tasks.Where(x => x.ProjectId == project.Id).Select(x => new BuildTaskDetailsDto
                { Id = x.Id, IsStarterTask = x.IsStarterTask, AcceptanceCriteria = x.AcceptanceCriteria }).ToList()
            };
        }).ToList();
    }
}
