using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Notifications;
using Abp.Runtime.Security;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Services.AiService;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.GamificationService;
using MosaicTalent.Services.PeerReviewService;
using MosaicTalent.Services.DeveloperProjectService.DTO;
using MosaicTalent.Services.NotificationChannelService;
using System.Net.Http;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace MosaicTalent.Services.DeveloperProjectService;

[AbpAuthorize]
public partial class DeveloperProjectAppService : MosaicTalentAppServiceBase, IDeveloperProjectAppService
{
    private readonly IRepository<Developer, Guid> _developerRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly IRepository<Project, Guid> _projectRepository;
    private readonly IRepository<ProjectMember, Guid> _projectMemberRepository;
    private readonly IRepository<ProjectSkill, Guid> _projectSkillRepository;
    private readonly IRepository<ProjectTask, Guid> _projectTaskRepository;
    private readonly IRepository<ProjectMeeting, Guid> _projectMeetingRepository;
    private readonly IRepository<ProjectMeetingReminderPreference, Guid> _projectMeetingReminderPreferenceRepository;
    private readonly IRepository<ProjectTeamInvite, Guid> _projectTeamInviteRepository;
    private readonly IRepository<DeveloperProfile, Guid> _developerProfileRepository;
    private readonly IRepository<DeveloperProfileSkill, Guid> _developerProfileSkillRepository;
    private readonly IRepository<DeveloperProfileGoal, Guid> _developerProfileGoalRepository;
    private readonly IGroqChatService _groqChatService;
    private readonly IPeerReviewGenerationService _peerReviewGenerationService;
    private readonly IProjectJoinNotificationDispatcher _projectJoinNotificationDispatcher;
    private readonly INotificationEventDispatcher _notificationEventDispatcher;
    private readonly IDeveloperGamificationService _developerGamificationService;
    private readonly IHttpClientFactory _httpClientFactory;

    public DeveloperProjectAppService(
        IRepository<Developer, Guid> developerRepository,
        IRepository<User, long> userRepository,
        IRepository<Project, Guid> projectRepository,
        IRepository<ProjectMember, Guid> projectMemberRepository,
        IRepository<ProjectSkill, Guid> projectSkillRepository,
        IRepository<ProjectTask, Guid> projectTaskRepository,
        IRepository<ProjectMeeting, Guid> projectMeetingRepository,
        IRepository<ProjectMeetingReminderPreference, Guid> projectMeetingReminderPreferenceRepository,
        IRepository<ProjectTeamInvite, Guid> projectTeamInviteRepository,
        IRepository<DeveloperProfile, Guid> developerProfileRepository,
        IRepository<DeveloperProfileSkill, Guid> developerProfileSkillRepository,
        IRepository<DeveloperProfileGoal, Guid> developerProfileGoalRepository,
        IGroqChatService groqChatService,
        IPeerReviewGenerationService peerReviewGenerationService,
        IProjectJoinNotificationDispatcher projectJoinNotificationDispatcher,
        INotificationEventDispatcher notificationEventDispatcher,
        IDeveloperGamificationService developerGamificationService,
        IHttpClientFactory httpClientFactory)
    {
        _developerRepository = developerRepository;
        _userRepository = userRepository;
        _projectRepository = projectRepository;
        _projectMemberRepository = projectMemberRepository;
        _projectSkillRepository = projectSkillRepository;
        _projectTaskRepository = projectTaskRepository;
        _projectMeetingRepository = projectMeetingRepository;
        _projectMeetingReminderPreferenceRepository = projectMeetingReminderPreferenceRepository;
        _projectTeamInviteRepository = projectTeamInviteRepository;
        _developerProfileRepository = developerProfileRepository;
        _developerProfileSkillRepository = developerProfileSkillRepository;
        _developerProfileGoalRepository = developerProfileGoalRepository;
        _groqChatService = groqChatService;
        _peerReviewGenerationService = peerReviewGenerationService;
        _projectJoinNotificationDispatcher = projectJoinNotificationDispatcher;
        _notificationEventDispatcher = notificationEventDispatcher;
        _developerGamificationService = developerGamificationService;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<List<DeveloperProjectDto>> GetMyProjects()
    {
        var developer = await GetCurrentDeveloper();

        var myProjectIds = await _projectMemberRepository.GetAll()
            .Where(x => x.DeveloperId == developer.Id)
            .Select(x => x.ProjectId)
            .Distinct()
            .ToListAsync();

        var projects = await _projectRepository.GetAll()
            .Where(x => myProjectIds.Contains(x.Id))
            .OrderByDescending(x => x.CreationTime)
            .ToListAsync();

        return await MapProjects(projects);
    }

    public async Task<List<DeveloperProjectDto>> GetOpenProjects()
    {
        var developer = await GetCurrentDeveloper();
        var developerSkills = await GetDeveloperSkills(developer.Id);
        var developerGoals = await GetDeveloperGoals(developer.Id);
        var myProjectIds = await _projectMemberRepository.GetAll()
            .Where(x => x.DeveloperId == developer.Id)
            .Select(x => x.ProjectId)
            .Distinct()
            .ToListAsync();

        var projects = await _projectRepository.GetAll()
            .Where(x => x.Status == ProjectStatus.Open && !myProjectIds.Contains(x.Id))
            .OrderByDescending(x => x.CreationTime)
            .ToListAsync();

        var mapped = await MapProjects(projects);
        var sorted = mapped
            .OrderByDescending(project => ScoreProjectMatch(project, developerSkills, developerGoals))
            .ThenByDescending(project => project.CreatedAt)
            .ToList();

        foreach (var project in sorted)
        {
            project.MatchScore = CalculateMatchScore(project, developerSkills, developerGoals);
        }

        return sorted;
    }

    public async Task<DeveloperProjectDto> GetProject(GetDeveloperProjectInput input)
    {
        var project = await _projectRepository.FirstOrDefaultAsync(input.ProjectId)
            ?? throw new UserFriendlyException("Project not found.");
        var mapped = await MapProjects(new List<Project> { project });
        return mapped.First();
    }

    public async Task<GithubConnectionStatusDto> GetGithubConnectionStatus()
    {
        var developer = await GetCurrentDeveloper();

        return new GithubConnectionStatusDto
        {
            IsConnected = !string.IsNullOrWhiteSpace(developer.GithubAccessTokenEncrypted),
            GithubUsername = developer.GithubUsername ?? string.Empty,
        };
    }

    public async Task<List<GithubRepositoryDto>> GetMyGithubRepositories()
    {
        var developer = await GetCurrentDeveloper();
        var repositories = await FetchGithubRepositories(developer);
        return repositories
            .OrderBy(repo => repo.FullName, StringComparer.OrdinalIgnoreCase)
            .Select(MapGithubRepository)
            .ToList();
    }

    public async Task<GithubRepositoryDto> CreateGithubRepository(CreateGithubRepositoryInput input)
    {
        var developer = await GetCurrentDeveloper();
        var token = ResolveGithubAccessToken(developer);
        var repositoryName = (input.Name ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(repositoryName))
        {
            throw new UserFriendlyException("Repository name is required.");
        }

        if (repositoryName.Any(char.IsWhiteSpace))
        {
            throw new UserFriendlyException("Repository name cannot contain spaces.");
        }

        var payload = new
        {
            name = repositoryName,
            description = input.Description?.Trim() ?? string.Empty,
            @private = input.IsPrivate,
            auto_init = true,
        };

        var request = BuildGithubRequest(HttpMethod.Post, "https://api.github.com/user/repos", token);
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json");

        var client = _httpClientFactory.CreateClient();
        using var response = await client.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            var githubError = ExtractGithubError(body);
            throw new UserFriendlyException(
                BuildCreateGithubRepositoryErrorMessage(response.StatusCode, githubError));
        }

        try
        {
            var created = JsonSerializer.Deserialize<GithubApiRepository>(body, GithubJsonOptions());
            if (created == null || string.IsNullOrWhiteSpace(created.FullName))
            {
                throw new UserFriendlyException("GitHub returned an invalid repository response.");
            }

            return MapGithubRepository(created);
        }
        catch (JsonException)
        {
            throw new UserFriendlyException("GitHub returned an unexpected repository response.");
        }
    }

    public async Task<DeveloperProjectDto> CreateProject(CreateDeveloperProjectInput input)
    {
        var developer = await GetCurrentDeveloper();
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var selectedRepo = (input.GithubRepo ?? string.Empty).Trim();
        string selectedRepoUrl = null;

        if (!string.IsNullOrWhiteSpace(selectedRepo))
        {
            var availableRepos = await FetchGithubRepositories(developer);
            var selectedRepoEntry = ResolveSelectedRepository(availableRepos, selectedRepo)
                ?? throw new UserFriendlyException("Selected GitHub repository was not found in your connected account.");
            selectedRepoUrl = NormalizeGithubRepoUrl(
                selectedRepoEntry.HtmlUrl?.Trim() ?? $"https://github.com/{selectedRepoEntry.FullName}");
            if (string.IsNullOrWhiteSpace(selectedRepoUrl))
            {
                throw new UserFriendlyException("Selected GitHub repository URL is invalid.");
            }

            var scanResult = await PerformRepoSafetyScan(selectedRepoUrl);
            if (!IsRepoSafe(scanResult))
            {
                throw new UserFriendlyException(
                    "Repository safety scan detected potentially malicious code. Select a safer repository before creating a project.");
            }
        }

        var normalizedSkills = (input.Skills ?? new List<string>())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var project = new Project
        {
            TenantId = tenantId,
            OwnerDeveloperId = developer.Id,
            Title = input.Title.Trim(),
            Description = input.Description.Trim(),
            MaxMembers = input.MaxMembers ?? 4,
            Difficulty = input.Difficulty,
            EstimatedHoursPerWeek = Math.Clamp(input.EstimatedHoursPerWeek, 1, 40),
            GithubRepo = selectedRepoUrl,
            Type = input.Type,
            Status = input.Status,
        };

        await _projectRepository.InsertAsync(project);
        await CurrentUnitOfWork.SaveChangesAsync();

        await _projectMemberRepository.InsertAsync(new ProjectMember
        {
            TenantId = tenantId,
            ProjectId = project.Id,
            DeveloperId = developer.Id,
            Role = MemberRole.Lead,
        });

        foreach (var skill in normalizedSkills)
        {
            await _projectSkillRepository.InsertAsync(new ProjectSkill
            {
                TenantId = tenantId,
                ProjectId = project.Id,
                Name = skill,
            });
        }
        await CurrentUnitOfWork.SaveChangesAsync();

        var mapped = await MapProjects(new List<Project> { project });
        return mapped.First();
    }

    public async Task<DeveloperProjectDto> JoinProject(JoinDeveloperProjectInput input)
    {
        var developer = await GetCurrentDeveloper();
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");

        var project = await _projectRepository.FirstOrDefaultAsync(input.ProjectId)
            ?? throw new UserFriendlyException("Project not found.");

        if (project.OwnerDeveloperId == developer.Id)
        {
            throw new UserFriendlyException("You are already the owner of this project.");
        }

        if (project.Status != ProjectStatus.Open)
        {
            throw new UserFriendlyException("Only open projects can be joined.");
        }

        var existingMembership = await _projectMemberRepository.GetAll()
            .AnyAsync(x => x.ProjectId == project.Id && x.DeveloperId == developer.Id);

        if (existingMembership)
        {
            throw new UserFriendlyException("You are already a member of this project.");
        }

        var workloadWarning = await BuildJoinLoadWarning(developer.Id, project);
        if (workloadWarning.ShouldWarn && !input.ConfirmHighWorkload)
        {
            throw new UserFriendlyException(workloadWarning.Message);
        }

        var memberCount = await _projectMemberRepository.GetAll()
            .CountAsync(x => x.ProjectId == project.Id);

        if (memberCount >= (project.MaxMembers ?? 4))
        {
            throw new UserFriendlyException("Project is already full.");
        }

        await _projectMemberRepository.InsertAsync(new ProjectMember
        {
            TenantId = tenantId,
            ProjectId = project.Id,
            DeveloperId = developer.Id,
            Role = MemberRole.Member,
        });
        await CurrentUnitOfWork.SaveChangesAsync();

        var pendingInvites = await _projectTeamInviteRepository.GetAll()
            .Where(x =>
                x.ProjectId == project.Id &&
                x.DeveloperId == developer.Id &&
                x.Status == ProjectTeamInviteStatus.Pending)
            .ToListAsync();
        foreach (var invite in pendingInvites)
        {
            invite.Status = ProjectTeamInviteStatus.Accepted;
            invite.RespondedAtUtc = DateTime.UtcNow;
            invite.ResponseReason = "Accepted by joining project directly.";
            await _projectTeamInviteRepository.UpdateAsync(invite);
        }
        await CurrentUnitOfWork.SaveChangesAsync();

        var existingMeetingIds = await _projectMeetingRepository.GetAll()
            .Where(x => x.ProjectId == project.Id)
            .Select(x => x.Id)
            .ToListAsync();
        await EnsureReminderPreferenceRows(project.Id, existingMeetingIds);

        try
        {
            await _projectJoinNotificationDispatcher.NotifyOwnerAboutJoinAsync(project, developer, tenantId);
        }
        catch (Exception ex)
        {
            Logger.Warn("Project join notifications failed.", ex);
        }

        var mapped = await MapProjects(new List<Project> { project });
        return mapped.First();
    }

    public async Task<DeveloperProjectDto> LeaveProject(LeaveProjectInput input)
    {
        if (input == null || input.ProjectId == Guid.Empty)
        {
            throw new UserFriendlyException("Project is required.");
        }

        var leaveReason = (input.Reason ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(leaveReason))
        {
            throw new UserFriendlyException("Tell us why you are leaving the project.");
        }

        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        var tenantId = project.TenantId;

        var memberships = await _projectMemberRepository.GetAll()
            .Where(x => x.ProjectId == project.Id)
            .ToListAsync();

        var currentMembership = memberships.FirstOrDefault(x => x.DeveloperId == developer.Id)
            ?? throw new UserFriendlyException("Project membership not found.");

        var remainingMembers = memberships
            .Where(x => x.DeveloperId != developer.Id)
            .ToList();

        if (remainingMembers.Count == 0)
        {
            throw new UserFriendlyException("You cannot leave as the only remaining member.");
        }

        if (currentMembership.Role == MemberRole.Lead &&
            remainingMembers.Count > 0 &&
            remainingMembers.All(x => x.Role != MemberRole.Lead))
        {
            throw new UserFriendlyException("Assign another project lead before leaving.");
        }

        await _projectMemberRepository.DeleteAsync(currentMembership);

        if (project.OwnerDeveloperId == developer.Id && remainingMembers.Count > 0)
        {
            var nextOwner = remainingMembers.FirstOrDefault(x => x.Role == MemberRole.Lead)
                ?? remainingMembers.First();
            if (nextOwner.Role != MemberRole.Lead)
            {
                nextOwner.Role = MemberRole.Lead;
                await _projectMemberRepository.UpdateAsync(nextOwner);
            }

            project.OwnerDeveloperId = nextOwner.DeveloperId;
            await _projectRepository.UpdateAsync(project);
        }

        await CurrentUnitOfWork.SaveChangesAsync();

        try
        {
            await NotifyLeadsAboutMemberLeave(project, developer, leaveReason, tenantId);
        }
        catch (Exception ex)
        {
            Logger.Warn("Failed to notify project leads about member leaving.", ex);
        }

        var mapped = await MapProjects(new List<Project> { project });
        return mapped.First();
    }

    public async Task DeleteProject(GetDeveloperProjectInput input)
    {
        if (input == null || input.ProjectId == Guid.Empty)
        {
            throw new UserFriendlyException("Project is required.");
        }

        var developer = await GetCurrentDeveloper();
        var project = await _projectRepository.FirstOrDefaultAsync(input.ProjectId)
            ?? throw new UserFriendlyException("Project not found.");

        var membership = await _projectMemberRepository.GetAll()
            .FirstOrDefaultAsync(x => x.ProjectId == project.Id && x.DeveloperId == developer.Id)
            ?? throw new UserFriendlyException("You are not a member of this project.");

        if (project.OwnerDeveloperId != developer.Id)
        {
            throw new UserFriendlyException("Only the project owner can delete this project.");
        }

        var memberCount = await _projectMemberRepository.GetAll()
            .CountAsync(x => x.ProjectId == project.Id);
        if (memberCount != 1 || membership.Role != MemberRole.Lead)
        {
            throw new UserFriendlyException(
                "You can only delete a project when you are the only member.");
        }

        await _projectRepository.DeleteAsync(project);
        await CurrentUnitOfWork.SaveChangesAsync();
    }

    [HttpPost]
    public async Task<DeveloperProjectDto> RemoveProjectMember(RemoveProjectMemberInput input)
    {
        if (input == null || input.ProjectId == Guid.Empty || input.MemberId == Guid.Empty)
        {
            throw new UserFriendlyException("Project member is required.");
        }

        var reason = (input.Reason ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new UserFriendlyException("Provide a reason for removing the member.");
        }

        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);

        var actorMembership = await _projectMemberRepository.GetAll()
            .FirstOrDefaultAsync(x => x.ProjectId == project.Id && x.DeveloperId == developer.Id)
            ?? throw new UserFriendlyException("Project membership not found.");

        if (project.OwnerDeveloperId != developer.Id && actorMembership.Role != MemberRole.Lead)
        {
            throw new UserFriendlyException("Only project leads can remove members.");
        }

        var targetMembership = await _projectMemberRepository.GetAll()
            .FirstOrDefaultAsync(x => x.ProjectId == project.Id && x.DeveloperId == input.MemberId)
            ?? throw new UserFriendlyException("Selected member is not part of this project.");

        if (targetMembership.DeveloperId == developer.Id)
        {
            throw new UserFriendlyException("Use leave project to remove yourself.");
        }

        if (targetMembership.DeveloperId == project.OwnerDeveloperId)
        {
            throw new UserFriendlyException("Project owner cannot be removed.");
        }

        if (targetMembership.Role == MemberRole.Lead)
        {
            var leadCount = await _projectMemberRepository.GetAll()
                .CountAsync(x => x.ProjectId == project.Id && x.Role == MemberRole.Lead);
            if (leadCount <= 1)
            {
                throw new UserFriendlyException("Project must have at least one lead.");
            }
        }

        var removedDeveloper = await _developerRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == targetMembership.DeveloperId);
        var actorUser = await _userRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == developer.UserId);
        var removedUser = removedDeveloper == null
            ? null
            : await _userRepository.GetAll().FirstOrDefaultAsync(x => x.Id == removedDeveloper.UserId);

        await _projectMemberRepository.DeleteAsync(targetMembership);
        await CurrentUnitOfWork.SaveChangesAsync();

        try
        {
            var clippedReason = reason.Length <= 280 ? reason : reason.Substring(0, 280) + "...";
            var actorDisplayName = $"{actorUser?.Name} {actorUser?.Surname}".Trim();
            if (string.IsNullOrWhiteSpace(actorDisplayName))
            {
                actorDisplayName = actorUser?.UserName ?? developer.GithubUsername ?? "Project lead";
            }

            var removedDisplayName = $"{removedUser?.Name} {removedUser?.Surname}".Trim();
            if (string.IsNullOrWhiteSpace(removedDisplayName))
            {
                removedDisplayName = removedUser?.UserName ?? removedDeveloper?.GithubUsername ?? "A member";
            }

            if (removedDeveloper?.UserId > 0)
            {
                var removedMessage =
                    $"You were removed from \"{project.Title}\". Reason: {clippedReason}";
                await _notificationEventDispatcher.NotifyUsersAsync(
                    project.TenantId,
                    new[] { removedDeveloper.UserId },
                    "MosaicTalent.ProjectMemberRemoved",
                    removedMessage,
                    NotificationSeverity.Warn,
                    "/app/projects",
                    "Removed from project",
                    removedMessage);
            }

            var leadRecipients = await ResolveProjectLeadUserIds(project.Id, developer.UserId);
            if (leadRecipients.Count > 0)
            {
                var leadMessage =
                    $"{removedDisplayName} was removed from \"{project.Title}\" by {actorDisplayName}. Reason: {clippedReason}";
                await _notificationEventDispatcher.NotifyUsersAsync(
                    project.TenantId,
                    leadRecipients,
                    "MosaicTalent.ProjectMemberRemovedByLead",
                    leadMessage,
                    NotificationSeverity.Info,
                    $"/app/projects/{project.Id}",
                    "Project member removed",
                    leadMessage);
            }
        }
        catch (Exception ex)
        {
            Logger.Warn("Failed to dispatch project member removal notifications.", ex);
        }

        var mapped = await MapProjects(new List<Project> { project });
        return mapped.First();
    }

    [HttpPost]
    public async Task SubmitProjectComplaint(SubmitProjectComplaintInput input)
    {
        if (input == null || input.ProjectId == Guid.Empty)
        {
            throw new UserFriendlyException("Project is required.");
        }

        var complaint = (input.Complaint ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(complaint))
        {
            throw new UserFriendlyException("Complaint details are required.");
        }

        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        var membership = await _projectMemberRepository.GetAll()
            .FirstOrDefaultAsync(x => x.ProjectId == project.Id && x.DeveloperId == developer.Id)
            ?? throw new UserFriendlyException("Project membership not found.");

        if (membership.Role == MemberRole.Lead || project.OwnerDeveloperId == developer.Id)
        {
            throw new UserFriendlyException("Only non-lead members can log complaints to project leads.");
        }

        var leadRecipients = await ResolveProjectLeadUserIds(project.Id, developer.UserId);
        if (leadRecipients.Count == 0)
        {
            throw new UserFriendlyException("No lead is available to receive this complaint.");
        }

        var reporterUser = await _userRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == developer.UserId);
        var reporterName = $"{reporterUser?.Name} {reporterUser?.Surname}".Trim();
        if (string.IsNullOrWhiteSpace(reporterName))
        {
            reporterName = reporterUser?.UserName ?? developer.GithubUsername ?? "A member";
        }

        var clippedComplaint = complaint.Length <= 360
            ? complaint
            : complaint.Substring(0, 360) + "...";
        var message =
            $"Complaint from {reporterName} in \"{project.Title}\": {clippedComplaint}";

        await _notificationEventDispatcher.NotifyUsersAsync(
            project.TenantId,
            leadRecipients,
            "MosaicTalent.ProjectComplaintLogged",
            message,
            NotificationSeverity.Warn,
            $"/app/projects/{project.Id}",
            "Project complaint logged",
            message);
    }

    [HttpPut]
    public async Task<DeveloperProjectDto> AssignMemberRole(AssignProjectMemberRoleInput input)
    {
        if (input == null || input.ProjectId == Guid.Empty || input.MemberId == Guid.Empty)
        {
            throw new UserFriendlyException("Project member is required.");
        }

        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);

        var actorMembership = await _projectMemberRepository.GetAll()
            .FirstOrDefaultAsync(x => x.ProjectId == project.Id && x.DeveloperId == developer.Id)
            ?? throw new UserFriendlyException("Project membership not found.");

        if (project.OwnerDeveloperId != developer.Id && actorMembership.Role != MemberRole.Lead)
        {
            throw new UserFriendlyException("Only project leads can assign member roles.");
        }

        var targetMembership = await _projectMemberRepository.GetAll()
            .FirstOrDefaultAsync(x => x.ProjectId == project.Id && x.DeveloperId == input.MemberId)
            ?? throw new UserFriendlyException("Selected member is not part of this project.");

        var targetRole = ParseMemberRole(input.Role);
        if (targetMembership.Role == targetRole)
        {
            var unchanged = await MapProjects(new List<Project> { project });
            return unchanged.First();
        }

        if (project.OwnerDeveloperId == targetMembership.DeveloperId && targetRole != MemberRole.Lead)
        {
            throw new UserFriendlyException("Project owner must remain a lead.");
        }

        if (targetMembership.Role == MemberRole.Lead && targetRole != MemberRole.Lead)
        {
            var leadCount = await _projectMemberRepository.GetAll()
                .CountAsync(x => x.ProjectId == project.Id && x.Role == MemberRole.Lead);

            if (leadCount <= 1)
            {
                throw new UserFriendlyException("Project must have at least one lead.");
            }
        }

        targetMembership.Role = targetRole;
        await _projectMemberRepository.UpdateAsync(targetMembership);
        await CurrentUnitOfWork.SaveChangesAsync();

        try
        {
            var targetUserId = await _developerRepository.GetAll()
                .Where(x => x.Id == targetMembership.DeveloperId)
                .Select(x => x.UserId)
                .FirstOrDefaultAsync();
            if (targetUserId > 0 && targetUserId != developer.UserId)
            {
                var roleLabel = targetRole == MemberRole.Lead ? "lead" : "member";
                var message = $"Your role in \"{project.Title}\" was updated to {roleLabel}.";
                await _notificationEventDispatcher.NotifyUsersAsync(
                    project.TenantId,
                    new[] { targetUserId },
                    "MosaicTalent.ProjectRoleUpdated",
                    message,
                    NotificationSeverity.Info,
                    $"/app/projects/{project.Id}",
                    "Project role updated",
                    message);
            }
        }
        catch (Exception ex)
        {
            Logger.Warn("Failed to dispatch project role update notification.", ex);
        }

        var mapped = await MapProjects(new List<Project> { project });
        return mapped.First();
    }

    public async Task<RepoSafetyScanResultDto> ScanRepoSafety(ScanRepoSafetyInput input)
    {
        if (input == null || input.ProjectId == Guid.Empty)
        {
            throw new UserFriendlyException("Project is required.");
        }

        var project = await _projectRepository.FirstOrDefaultAsync(input.ProjectId)
            ?? throw new UserFriendlyException("Project not found.");

        var repoUrl = NormalizeGithubRepoUrl(project.GithubRepo);
        if (string.IsNullOrWhiteSpace(repoUrl))
        {
            throw new UserFriendlyException("Project repository must be a GitHub URL.");
        }

        var result = await PerformRepoSafetyScan(repoUrl);
        await PersistProjectRepoSafetyAndNotify(project, result);
        return result;
    }

    public async Task<RepoSafetyScanResultDto> ScanRepoSafetyByUrl(ScanRepoSafetyByUrlInput input)
    {
        var repoUrl = NormalizeGithubRepoUrl(input?.GithubUrl);
        if (string.IsNullOrWhiteSpace(repoUrl))
        {
            throw new UserFriendlyException("Repository URL must be a valid GitHub URL.");
        }

        return await PerformRepoSafetyScan(repoUrl);
    }

    public async Task<DeveloperProjectDto> AiMatchProject()
    {
        var developer = await GetCurrentDeveloper();
        var developerSkills = await GetDeveloperSkills(developer.Id);
        var developerGoals = await GetDeveloperGoals(developer.Id);
        var openProjects = await GetOpenProjects();

        if (openProjects.Count == 0)
        {
            return null;
        }

        var selection = await SelectProjectWithGroq(openProjects, developerSkills, developerGoals);
        if (selection?.ProjectId != null)
        {
            var selected = openProjects.FirstOrDefault(x => x.Id == selection.ProjectId.Value);
            if (selected != null)
            {
                selected.MatchInsight = selection.Insight;
                selected.LearningOutcomes = selection.LearningOutcomes;
                return selected;
            }
        }

        var fallback = openProjects
            .OrderByDescending(project => project.MatchScore)
            .FirstOrDefault();
        if (fallback == null)
        {
            return null;
        }

        fallback.MatchInsight = BuildFallbackInsight(fallback, developerSkills, developerGoals);
        fallback.LearningOutcomes = BuildFallbackLearningOutcomes(fallback, developerSkills);
        return fallback;
    }

    public async Task<DeveloperProjectDto> AiFillTeam(GetDeveloperProjectInput input)
    {
        var developer = await GetCurrentDeveloper();
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");

        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        var myMembership = await _projectMemberRepository.GetAll()
            .FirstOrDefaultAsync(x => x.ProjectId == project.Id && x.DeveloperId == developer.Id)
            ?? throw new UserFriendlyException("Project membership not found.");

        if (project.OwnerDeveloperId != developer.Id && myMembership.Role != MemberRole.Lead)
        {
            throw new UserFriendlyException("Only project leads can fill the team.");
        }

        if (project.Status == ProjectStatus.Complete)
        {
            throw new UserFriendlyException("Completed projects cannot be updated.");
        }

        var maxMembers = project.MaxMembers ?? 4;

        var currentMembers = await _projectMemberRepository.GetAll()
            .Where(x => x.ProjectId == project.Id)
            .ToListAsync();

        var currentMemberIds = currentMembers.Select(x => x.DeveloperId).ToHashSet();
        var pendingInvites = await _projectTeamInviteRepository.GetAll()
            .Where(x => x.ProjectId == project.Id && x.Status == ProjectTeamInviteStatus.Pending)
            .ToListAsync();
        var pendingInviteDeveloperIds = pendingInvites
            .Select(x => x.DeveloperId)
            .ToHashSet();
        var availableSlots = Math.Max(maxMembers - (currentMembers.Count + pendingInvites.Count), 0);

        if (availableSlots > 0)
        {
            var candidates = await _developerRepository.GetAll()
                .Where(x => !currentMemberIds.Contains(x.Id) && !pendingInviteDeveloperIds.Contains(x.Id))
                .OrderBy(x => x.CreationTime)
                .Take(40)
                .ToListAsync();

            var candidateIds = await SelectCandidatesWithGroq(project.Id, candidates, availableSlots);
            var selectedCandidates = candidates
                .Where(x => candidateIds.Contains(x.Id))
                .Take(availableSlots)
                .ToList();

            if (selectedCandidates.Count == 0)
            {
                selectedCandidates = (await RankCandidatesBySkills(project.Id, candidates))
                    .Take(availableSlots)
                    .ToList();
            }

            foreach (var candidate in selectedCandidates)
            {
                await _projectTeamInviteRepository.InsertAsync(new ProjectTeamInvite
                {
                    TenantId = tenantId,
                    ProjectId = project.Id,
                    DeveloperId = candidate.Id,
                    InvitedByDeveloperId = developer.Id,
                    Status = ProjectTeamInviteStatus.Pending,
                });
            }

            await CurrentUnitOfWork.SaveChangesAsync();

            if (selectedCandidates.Count > 0)
            {
                try
                {
                    foreach (var candidate in selectedCandidates)
                    {
                        await _projectJoinNotificationDispatcher.NotifyDeveloperAboutInviteAsync(
                            project,
                            candidate,
                            developer,
                            tenantId);
                    }
                }
                catch (Exception ex)
                {
                    Logger.Warn("Failed to dispatch project invite notifications.", ex);
                }
            }
        }

        var mapped = await MapProjects(new List<Project> { project });
        return mapped.First();
    }

    [HttpGet]
    public async Task<List<ProjectTeamInviteDto>> GetProjectInvites(GetDeveloperProjectInput input)
    {
        if (input == null || input.ProjectId == Guid.Empty)
        {
            throw new UserFriendlyException("Project is required.");
        }

        var developer = await GetCurrentDeveloper();
        var project = await _projectRepository.FirstOrDefaultAsync(input.ProjectId)
            ?? throw new UserFriendlyException("Project not found.");

        var isMember = await _projectMemberRepository.GetAll()
            .AnyAsync(x => x.ProjectId == project.Id && x.DeveloperId == developer.Id);
        var hasInvite = await _projectTeamInviteRepository.GetAll()
            .AnyAsync(x =>
                x.ProjectId == project.Id &&
                x.DeveloperId == developer.Id &&
                x.Status == ProjectTeamInviteStatus.Pending);
        if (!isMember && !hasInvite)
        {
            throw new UserFriendlyException("You do not have access to this project invite list.");
        }

        var invites = await _projectTeamInviteRepository.GetAll()
            .Where(x => x.ProjectId == project.Id)
            .OrderByDescending(x => x.CreationTime)
            .ToListAsync();
        if (invites.Count == 0)
        {
            return new List<ProjectTeamInviteDto>();
        }

        var developerIds = invites
            .Select(x => x.DeveloperId)
            .Concat(invites.Select(x => x.InvitedByDeveloperId))
            .Distinct()
            .ToList();
        var nameMap = await BuildMemberNameMap(developerIds);
        var developers = await _developerRepository.GetAll()
            .Where(x => developerIds.Contains(x.Id))
            .ToListAsync();
        var userIds = developers.Select(x => x.UserId).Distinct().ToList();
        var users = await _userRepository.GetAll()
            .Where(x => userIds.Contains(x.Id))
            .ToListAsync();
        var userNameByDeveloperId = developers.ToDictionary(
            x => x.Id,
            x => users.FirstOrDefault(user => user.Id == x.UserId)?.UserName ?? string.Empty);

        return invites.Select(invite => new ProjectTeamInviteDto
        {
            Id = invite.Id.ToString(),
            ProjectId = invite.ProjectId.ToString(),
            DeveloperId = invite.DeveloperId.ToString(),
            DeveloperName = nameMap.TryGetValue(invite.DeveloperId, out var developerName)
                ? developerName
                : "Developer",
            DeveloperUserName = userNameByDeveloperId.TryGetValue(invite.DeveloperId, out var userName)
                ? userName
                : string.Empty,
            InvitedByDeveloperId = invite.InvitedByDeveloperId.ToString(),
            InvitedByDeveloperName = nameMap.TryGetValue(invite.InvitedByDeveloperId, out var invitedByName)
                ? invitedByName
                : "Project lead",
            Status = ToProjectInviteStatusLabel(invite.Status),
            InvitedAtUtc = invite.CreationTime,
            RespondedAtUtc = invite.RespondedAtUtc,
        }).ToList();
    }

    [HttpPost]
    public async Task<ProjectTeamInviteDto> AcceptProjectInvite(AcceptProjectInviteInput input)
    {
        if (input == null || input.ProjectId == Guid.Empty || input.InviteId == Guid.Empty)
        {
            throw new UserFriendlyException("Invite is required.");
        }

        var developer = await GetCurrentDeveloper();
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var project = await _projectRepository.FirstOrDefaultAsync(input.ProjectId)
            ?? throw new UserFriendlyException("Project not found.");
        if (project.Status != ProjectStatus.Open)
        {
            throw new UserFriendlyException("Only open projects can accept invites.");
        }

        var invite = await _projectTeamInviteRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == input.InviteId && x.ProjectId == input.ProjectId)
            ?? throw new UserFriendlyException("Invite not found.");
        if (invite.DeveloperId != developer.Id)
        {
            throw new UserFriendlyException("You are not allowed to accept this invite.");
        }
        if (invite.Status != ProjectTeamInviteStatus.Pending)
        {
            throw new UserFriendlyException("Invite has already been processed.");
        }

        var isMember = await _projectMemberRepository.GetAll()
            .AnyAsync(x => x.ProjectId == project.Id && x.DeveloperId == developer.Id);
        if (!isMember)
        {
            var memberCount = await _projectMemberRepository.GetAll()
                .CountAsync(x => x.ProjectId == project.Id);
            if (memberCount >= (project.MaxMembers ?? 4))
            {
                throw new UserFriendlyException("Project is already full.");
            }

            await _projectMemberRepository.InsertAsync(new ProjectMember
            {
                TenantId = tenantId,
                ProjectId = project.Id,
                DeveloperId = developer.Id,
                Role = MemberRole.Member,
            });
        }

        invite.Status = ProjectTeamInviteStatus.Accepted;
        invite.RespondedAtUtc = DateTime.UtcNow;
        invite.ResponseReason = "Accepted";
        await _projectTeamInviteRepository.UpdateAsync(invite);
        await CurrentUnitOfWork.SaveChangesAsync();

        var meetingIds = await _projectMeetingRepository.GetAll()
            .Where(x => x.ProjectId == project.Id)
            .Select(x => x.Id)
            .ToListAsync();
        await EnsureReminderPreferenceRows(project.Id, meetingIds);

        try
        {
            await _projectJoinNotificationDispatcher.NotifyOwnerAboutJoinAsync(project, developer, tenantId);
        }
        catch (Exception ex)
        {
            Logger.Warn("Project invite accept notifications failed.", ex);
        }

        return await MapProjectInviteDto(invite);
    }

    [HttpPost]
    public async Task<ProjectTeamInviteDto> RejectProjectInvite(RejectProjectInviteInput input)
    {
        if (input == null || input.ProjectId == Guid.Empty || input.InviteId == Guid.Empty)
        {
            throw new UserFriendlyException("Invite is required.");
        }

        var developer = await GetCurrentDeveloper();
        var project = await _projectRepository.FirstOrDefaultAsync(input.ProjectId)
            ?? throw new UserFriendlyException("Project not found.");
        var invite = await _projectTeamInviteRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == input.InviteId && x.ProjectId == input.ProjectId)
            ?? throw new UserFriendlyException("Invite not found.");
        if (invite.DeveloperId != developer.Id)
        {
            throw new UserFriendlyException("You are not allowed to reject this invite.");
        }
        if (invite.Status != ProjectTeamInviteStatus.Pending)
        {
            throw new UserFriendlyException("Invite has already been processed.");
        }

        var reason = (input.Reason ?? string.Empty).Trim();
        invite.Status = ProjectTeamInviteStatus.Rejected;
        invite.RespondedAtUtc = DateTime.UtcNow;
        invite.ResponseReason = string.IsNullOrWhiteSpace(reason) ? "Rejected" : reason;
        await _projectTeamInviteRepository.UpdateAsync(invite);
        await CurrentUnitOfWork.SaveChangesAsync();

        try
        {
            var leadRecipients = await ResolveProjectLeadUserIds(project.Id, developer.UserId);
            if (leadRecipients.Count > 0)
            {
                var rejectingName = await ResolveDeveloperDisplayName(developer.Id);
                var clippedReason = string.IsNullOrWhiteSpace(reason)
                    ? "No reason provided."
                    : (reason.Length <= 280 ? reason : reason.Substring(0, 280) + "...");
                var message =
                    $"{rejectingName} declined project invite for \"{project.Title}\". Reason: {clippedReason}";
                await _notificationEventDispatcher.NotifyUsersAsync(
                    project.TenantId,
                    leadRecipients,
                    "MosaicTalent.ProjectInviteRejected",
                    message,
                    NotificationSeverity.Warn,
                    $"/app/projects/{project.Id}",
                    "Project invite rejected",
                    message);
            }
        }
        catch (Exception ex)
        {
            Logger.Warn("Project invite rejection notifications failed.", ex);
        }

        return await MapProjectInviteDto(invite);
    }

    private async Task<ProjectTeamInviteDto> MapProjectInviteDto(ProjectTeamInvite invite)
    {
        var nameMap = await BuildMemberNameMap(new List<Guid> { invite.DeveloperId, invite.InvitedByDeveloperId });
        var developers = await _developerRepository.GetAll()
            .Where(x => x.Id == invite.DeveloperId || x.Id == invite.InvitedByDeveloperId)
            .ToListAsync();
        var userIds = developers.Select(x => x.UserId).Distinct().ToList();
        var users = await _userRepository.GetAll()
            .Where(x => userIds.Contains(x.Id))
            .ToListAsync();
        var developer = developers.FirstOrDefault(x => x.Id == invite.DeveloperId);
        var developerUserName = users.FirstOrDefault(x => x.Id == (developer?.UserId ?? 0))?.UserName ?? string.Empty;

        return new ProjectTeamInviteDto
        {
            Id = invite.Id.ToString(),
            ProjectId = invite.ProjectId.ToString(),
            DeveloperId = invite.DeveloperId.ToString(),
            DeveloperName = nameMap.TryGetValue(invite.DeveloperId, out var developerName)
                ? developerName
                : "Developer",
            DeveloperUserName = developerUserName,
            InvitedByDeveloperId = invite.InvitedByDeveloperId.ToString(),
            InvitedByDeveloperName = nameMap.TryGetValue(invite.InvitedByDeveloperId, out var invitedByName)
                ? invitedByName
                : "Project lead",
            Status = ToProjectInviteStatusLabel(invite.Status),
            InvitedAtUtc = invite.CreationTime,
            RespondedAtUtc = invite.RespondedAtUtc,
        };
    }

    public async Task<DeveloperProjectTaskDto> AddProjectTask(AddProjectTaskInput input)
    {
        var developer = await GetCurrentDeveloper();
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);

        if (project.Status == ProjectStatus.Complete)
        {
            throw new UserFriendlyException("Completed projects cannot be updated.");
        }

        Guid? assignedDeveloperId = null;
        if (input.AssignedMemberId.HasValue && input.AssignedMemberId.Value != Guid.Empty)
        {
            var isAssignedMemberInProject = await _projectMemberRepository.GetAll()
                .AnyAsync(x => x.ProjectId == project.Id && x.DeveloperId == input.AssignedMemberId.Value);
            if (!isAssignedMemberInProject)
            {
                throw new UserFriendlyException("Assigned member must belong to the selected project.");
            }

            assignedDeveloperId = input.AssignedMemberId.Value;
        }

        var task = new ProjectTask
        {
            TenantId = tenantId,
            ProjectId = project.Id,
            Title = input.Title.Trim(),
            Description = input.Description?.Trim(),
            AssignedDeveloperId = assignedDeveloperId,
            Status = ProjectTaskStatus.Todo,
        };

        await _projectTaskRepository.InsertAsync(task);
        await CurrentUnitOfWork.SaveChangesAsync();

        if (assignedDeveloperId.HasValue)
        {
            await NotifyTaskAssigned(project, task, assignedDeveloperId.Value);
        }

        return await MapTaskDto(task);
    }

    public async Task<DeveloperProjectTaskDto> ReassignProjectTask(ReassignProjectTaskInput input)
    {
        if (input == null || input.ProjectId == Guid.Empty || input.TaskId == Guid.Empty)
        {
            throw new UserFriendlyException("Project task is required.");
        }

        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        if (project.Status == ProjectStatus.Complete)
        {
            throw new UserFriendlyException("Completed projects cannot be updated.");
        }

        var task = await _projectTaskRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == input.TaskId && x.ProjectId == input.ProjectId)
            ?? throw new UserFriendlyException("Task not found.");

        Guid? assignedDeveloperId = null;
        if (input.AssignedMemberId.HasValue && input.AssignedMemberId.Value != Guid.Empty)
        {
            var isAssignedMemberInProject = await _projectMemberRepository.GetAll()
                .AnyAsync(x => x.ProjectId == project.Id && x.DeveloperId == input.AssignedMemberId.Value);
            if (!isAssignedMemberInProject)
            {
                throw new UserFriendlyException("Assigned member must belong to the selected project.");
            }

            assignedDeveloperId = input.AssignedMemberId.Value;
        }

        var previousAssignedDeveloperId = task.AssignedDeveloperId;
        task.AssignedDeveloperId = assignedDeveloperId;
        await _projectTaskRepository.UpdateAsync(task);
        await CurrentUnitOfWork.SaveChangesAsync();

        if (assignedDeveloperId.HasValue &&
            (!previousAssignedDeveloperId.HasValue || previousAssignedDeveloperId.Value != assignedDeveloperId.Value))
        {
            await NotifyTaskAssigned(project, task, assignedDeveloperId.Value);
        }

        return await MapTaskDto(task);
    }

    public async Task<DeveloperProjectTaskDto> UpdateProjectTaskStatus(UpdateProjectTaskStatusInput input)
    {
        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);

        if (project.Status == ProjectStatus.Complete)
        {
            throw new UserFriendlyException("Completed projects cannot be updated.");
        }

        var task = await _projectTaskRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == input.TaskId && x.ProjectId == input.ProjectId)
            ?? throw new UserFriendlyException("Task not found.");

        var previousStatus = task.Status;
        task.Status = ParseTaskStatus(input.Status);
        await _projectTaskRepository.UpdateAsync(task);
        await CurrentUnitOfWork.SaveChangesAsync();

        if (task.Status == ProjectTaskStatus.Done && previousStatus != ProjectTaskStatus.Done)
        {
            await NotifyTaskMovedToDone(project, task);
        }

        return await MapTaskDto(task);
    }

    private async Task<DeveloperProjectTaskDto> MapTaskDto(ProjectTask task)
    {
        var assignedMemberName = task.AssignedDeveloperId.HasValue
            ? await ResolveDeveloperDisplayName(task.AssignedDeveloperId.Value)
            : string.Empty;

        return new DeveloperProjectTaskDto
        {
            Id = task.Id.ToString(),
            Title = task.Title,
            Description = task.Description,
            Status = ToTaskStatusLabel(task.Status),
            AssignedMemberId = task.AssignedDeveloperId?.ToString() ?? string.Empty,
            AssignedMemberName = assignedMemberName,
        };
    }

    private async Task NotifyTaskAssigned(Project project, ProjectTask task, Guid assignedDeveloperId)
    {
        try
        {
            var assignedUserId = await _developerRepository.GetAll()
                .Where(x => x.Id == assignedDeveloperId)
                .Select(x => x.UserId)
                .FirstOrDefaultAsync();
            if (assignedUserId <= 0)
            {
                return;
            }

            var message = $"You were assigned task \"{task.Title}\" in \"{project.Title}\".";
            await _notificationEventDispatcher.NotifyUsersAsync(
                project.TenantId,
                new[] { assignedUserId },
                "MosaicTalent.ProjectTaskAssigned",
                message,
                NotificationSeverity.Info,
                $"/app/projects/{project.Id}",
                "Task assigned",
                message);
        }
        catch (Exception ex)
        {
            Logger.Warn("Failed to dispatch task assignment notification.", ex);
        }
    }

    private async Task NotifyTaskMovedToDone(Project project, ProjectTask task)
    {
        try
        {
            var memberUserIds = await ResolveProjectMemberUserIds(project.Id);
            if (memberUserIds.Count == 0)
            {
                return;
            }

            var message = $"Task \"{task.Title}\" in \"{project.Title}\" was moved to Done.";
            await _notificationEventDispatcher.NotifyUsersAsync(
                project.TenantId,
                memberUserIds,
                "MosaicTalent.ProjectTaskCompleted",
                message,
                NotificationSeverity.Success,
                $"/app/projects/{project.Id}",
                "Task completed",
                message);
        }
        catch (Exception ex)
        {
            Logger.Warn("Failed to dispatch task completion notification.", ex);
        }
    }

    public async Task<DeveloperProjectDto> UpdateProjectSkills(UpdateProjectSkillsInput input)
    {
        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);

        var myMembership = await _projectMemberRepository.GetAll()
            .FirstOrDefaultAsync(x => x.ProjectId == project.Id && x.DeveloperId == developer.Id)
            ?? throw new UserFriendlyException("Project membership not found.");

        if (project.OwnerDeveloperId != developer.Id && myMembership.Role != MemberRole.Lead)
        {
            throw new UserFriendlyException("Only project leads can update project skills.");
        }

        if (project.Status == ProjectStatus.Complete)
        {
            throw new UserFriendlyException("Completed projects cannot be updated.");
        }

        var normalizedSkills = (input.Skills ?? new List<string>())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var existing = await _projectSkillRepository.GetAll()
            .Where(x => x.ProjectId == project.Id)
            .ToListAsync();

        foreach (var skill in existing)
        {
            await _projectSkillRepository.DeleteAsync(skill);
        }

        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        foreach (var skill in normalizedSkills)
        {
            await _projectSkillRepository.InsertAsync(new ProjectSkill
            {
                TenantId = tenantId,
                ProjectId = project.Id,
                Name = skill,
            });
        }

        await CurrentUnitOfWork.SaveChangesAsync();

        var mapped = await MapProjects(new List<Project> { project });
        return mapped.First();
    }

    public async Task<DeveloperProjectDto> CompleteProject(GetDeveloperProjectInput input)
    {
        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);

        var myMembership = await _projectMemberRepository.GetAll()
            .FirstOrDefaultAsync(x => x.ProjectId == project.Id && x.DeveloperId == developer.Id)
            ?? throw new UserFriendlyException("Project membership not found.");

        if (project.OwnerDeveloperId != developer.Id && myMembership.Role != MemberRole.Lead)
        {
            throw new UserFriendlyException("Only project leads can complete projects.");
        }

        var tasks = await _projectTaskRepository.GetAll()
            .Where(x => x.ProjectId == project.Id)
            .ToListAsync();

        if (tasks.Count == 0)
        {
            throw new UserFriendlyException("Add at least one task before completing a project.");
        }

        if (tasks.Any(x => x.Status != ProjectTaskStatus.Done))
        {
            throw new UserFriendlyException("All project tasks must be in Done before completion.");
        }

        project.Status = ProjectStatus.Complete;
        await _projectRepository.UpdateAsync(project);
        await CurrentUnitOfWork.SaveChangesAsync();
        await _peerReviewGenerationService.EnsureGeneratedForProject(project.Id, project.TenantId);
        await CurrentUnitOfWork.SaveChangesAsync();

        try
        {
            var memberDeveloperIds = await _projectMemberRepository.GetAll()
                .Where(x => x.ProjectId == project.Id)
                .Select(x => x.DeveloperId)
                .Distinct()
                .ToListAsync();

            await _developerGamificationService.AwardAsync(
                project.TenantId,
                developer.Id,
                "project_completed_lead",
                $"project-completed-lead:{project.Id}",
                $"project:{project.Id}");

            foreach (var memberDeveloperId in memberDeveloperIds.Where(x => x != developer.Id))
            {
                await _developerGamificationService.AwardAsync(
                    project.TenantId,
                    memberDeveloperId,
                    "project_completed_member",
                    $"project-completed-member:{project.Id}:{memberDeveloperId}",
                    $"project:{project.Id}");
            }
        }
        catch (Exception ex)
        {
            Logger.Warn("Failed to award project completion gamification points.", ex);
        }

        try
        {
            var memberUserIds = await ResolveProjectMemberUserIds(project.Id);
            var recipients = memberUserIds
                .Where(userId => userId != developer.UserId)
                .ToList();
            if (recipients.Count > 0)
            {
                var message = $"\"{project.Title}\" was marked complete. Peer review is now available.";
                await _notificationEventDispatcher.NotifyUsersAsync(
                    project.TenantId,
                    recipients,
                    "MosaicTalent.ProjectCompleted",
                    message,
                    NotificationSeverity.Success,
                    "/app/reviews",
                    "Project completed",
                    message);
            }
        }
        catch (Exception ex)
        {
            Logger.Warn("Failed to dispatch project completion notifications.", ex);
        }

        var mapped = await MapProjects(new List<Project> { project });
        return mapped.First();
    }

    private async Task NotifyLeadsAboutMemberLeave(
        Project project,
        Developer leavingDeveloper,
        string leaveReason,
        int tenantId)
    {
        var leadDeveloperIds = await _projectMemberRepository.GetAll()
            .Where(x => x.ProjectId == project.Id && x.Role == MemberRole.Lead)
            .Select(x => x.DeveloperId)
            .Distinct()
            .ToListAsync();

        if (leadDeveloperIds.Count == 0)
        {
            return;
        }

        var leadUserIds = await _developerRepository.GetAll()
            .Where(x => leadDeveloperIds.Contains(x.Id))
            .Select(x => x.UserId)
            .Distinct()
            .ToListAsync();

        var recipients = leadUserIds
            .Where(userId => userId > 0 && userId != leavingDeveloper.UserId)
            .Distinct()
            .ToList();
        if (recipients.Count == 0)
        {
            return;
        }

        var leavingUser = await _userRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == leavingDeveloper.UserId);
        var clippedReason = leaveReason.Length <= 240
            ? leaveReason
            : leaveReason.Substring(0, 240) + "...";
        var leadFeedback = await BuildLeaveFeedbackForLead(project, leavingDeveloper, leavingUser, leaveReason);

        var displayName = $"{leavingUser?.Name} {leavingUser?.Surname}".Trim();
        if (string.IsNullOrWhiteSpace(displayName))
        {
            displayName = leavingUser?.UserName ?? leavingDeveloper.GithubUsername ?? "A member";
        }

        var message = $"{displayName} left \"{project.Title}\". Reason: {clippedReason}";
        if (!string.IsNullOrWhiteSpace(leadFeedback))
        {
            message += $" Lead feedback: {leadFeedback}";
        }

        await _notificationEventDispatcher.NotifyUsersAsync(
            tenantId,
            recipients,
            "MosaicTalent.ProjectMemberLeft",
            message,
            NotificationSeverity.Info,
            $"/app/projects/{project.Id}",
            "Project member left",
            message);
    }

    private async Task<string> BuildLeaveFeedbackForLead(
        Project project,
        Developer leavingDeveloper,
        User leavingUser,
        string leaveReason)
    {
        if (!_groqChatService.IsConfigured())
        {
            return BuildFallbackLeadFeedback(leaveReason);
        }

        var payload = new
        {
            project = new
            {
                title = project.Title,
                description = project.Description,
                status = project.Status.ToString(),
            },
            member = new
            {
                name = $"{leavingUser?.Name} {leavingUser?.Surname}".Trim(),
                userName = leavingUser?.UserName ?? leavingDeveloper.GithubUsername,
                yearsOfExperience = leavingDeveloper.YearsOfExperience,
            },
            leaveReason,
        };

        var systemPrompt =
            "You are a team health assistant. Analyze why a project member left and return only JSON with {\"summary\":\"short insight for lead\",\"leadActions\":[\"action item\"]}. Keep summary under 160 chars and provide at most 2 actions.";
        var userPrompt = JsonSerializer.Serialize(payload);
        var response = await _groqChatService.TryCompleteAsync(systemPrompt, userPrompt);

        if (string.IsNullOrWhiteSpace(response))
        {
            return BuildFallbackLeadFeedback(leaveReason);
        }

        try
        {
            using var document = JsonDocument.Parse(response);
            var summary = document.RootElement.TryGetProperty("summary", out var summaryElement)
                ? summaryElement.GetString()
                : string.Empty;
            var actions = new List<string>();
            if (document.RootElement.TryGetProperty("leadActions", out var actionsElement) &&
                actionsElement.ValueKind == JsonValueKind.Array)
            {
                actions = actionsElement.EnumerateArray()
                    .Select(x => x.GetString())
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x.Trim())
                    .Take(2)
                    .ToList();
            }

            var feedback = (summary ?? string.Empty).Trim();
            if (actions.Count > 0)
            {
                var actionText = string.Join("; ", actions);
                feedback = string.IsNullOrWhiteSpace(feedback)
                    ? actionText
                    : $"{feedback} Actions: {actionText}";
            }

            return string.IsNullOrWhiteSpace(feedback)
                ? BuildFallbackLeadFeedback(leaveReason)
                : feedback;
        }
        catch
        {
            return BuildFallbackLeadFeedback(leaveReason);
        }
    }

    private static string BuildFallbackLeadFeedback(string leaveReason)
    {
        if (string.IsNullOrWhiteSpace(leaveReason))
        {
            return "Follow up with the team to understand blockers and workload pressure.";
        }

        var lowered = leaveReason.ToLowerInvariant();
        if (lowered.Contains("time") || lowered.Contains("busy") || lowered.Contains("workload"))
        {
            return "Possible capacity mismatch. Rebalance scope and check team availability.";
        }

        if (lowered.Contains("communication") || lowered.Contains("support") || lowered.Contains("unclear"))
        {
            return "Possible collaboration gap. Clarify ownership and increase lead check-ins.";
        }

        return "Schedule a quick retrospective with remaining members and align expectations.";
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

    private async Task<List<GithubApiRepository>> FetchGithubRepositories(Developer developer)
    {
        var token = ResolveGithubAccessToken(developer);
        var request = BuildGithubRequest(
            HttpMethod.Get,
            "https://api.github.com/user/repos?per_page=100&sort=updated&type=owner",
            token);

        var client = _httpClientFactory.CreateClient();
        using var response = await client.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            throw new UserFriendlyException(
                ExtractGithubError(body)
                ?? "Failed to fetch GitHub repositories. Reconnect GitHub and try again.");
        }

        try
        {
            return JsonSerializer.Deserialize<List<GithubApiRepository>>(body, GithubJsonOptions())
                   ?? new List<GithubApiRepository>();
        }
        catch (JsonException)
        {
            throw new UserFriendlyException("GitHub returned an unexpected repositories response.");
        }
    }

    private static HttpRequestMessage BuildGithubRequest(HttpMethod method, string url, string token)
    {
        var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Headers.UserAgent.ParseAdd("MosaicTalent");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        request.Headers.Add("X-GitHub-Api-Version", "2022-11-28");
        return request;
    }

    private string ResolveGithubAccessToken(Developer developer)
    {
        if (string.IsNullOrWhiteSpace(developer.GithubAccessTokenEncrypted))
        {
            throw new UserFriendlyException("Connect your GitHub account before creating a project.");
        }

        try
        {
            var token = SimpleStringCipher.Instance.Decrypt(developer.GithubAccessTokenEncrypted);
            if (string.IsNullOrWhiteSpace(token))
            {
                throw new UserFriendlyException("GitHub connection token is empty. Reconnect GitHub.");
            }

            return token;
        }
        catch (Exception)
        {
            throw new UserFriendlyException("GitHub connection is invalid. Reconnect GitHub and try again.");
        }
    }

    private static GithubApiRepository ResolveSelectedRepository(
        IReadOnlyCollection<GithubApiRepository> repositories,
        string selectedRepo)
    {
        var selectedKey = NormalizeGithubRepoKey(selectedRepo);
        return repositories.FirstOrDefault(repo =>
            string.Equals(repo.FullName, selectedKey, StringComparison.OrdinalIgnoreCase));
    }

    private static string NormalizeGithubRepoKey(string raw)
    {
        var value = (raw ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        if (Uri.TryCreate(value, UriKind.Absolute, out var absoluteUri))
        {
            if (!string.Equals(absoluteUri.Host, "github.com", StringComparison.OrdinalIgnoreCase))
            {
                return value;
            }

            var segments = absoluteUri.AbsolutePath
                .Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (segments.Length >= 2)
            {
                var repoName = segments[1].EndsWith(".git", StringComparison.OrdinalIgnoreCase)
                    ? segments[1].Substring(0, segments[1].Length - 4)
                    : segments[1];
                return $"{segments[0]}/{repoName}";
            }
        }

        var normalized = value.EndsWith(".git", StringComparison.OrdinalIgnoreCase)
            ? value.Substring(0, value.Length - 4)
            : value;

        return normalized;
    }

    private static string NormalizeGithubRepoUrl(string raw)
    {
        var value = (raw ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        if (Uri.TryCreate(value, UriKind.Absolute, out var absoluteUri))
        {
            if (!string.Equals(absoluteUri.Host, "github.com", StringComparison.OrdinalIgnoreCase))
            {
                return string.Empty;
            }

            var repoKey = NormalizeGithubRepoKey(value);
            return string.IsNullOrWhiteSpace(repoKey) ? string.Empty : $"https://github.com/{repoKey}";
        }

        var normalized = NormalizeGithubRepoKey(value);
        return string.IsNullOrWhiteSpace(normalized) ? string.Empty : $"https://github.com/{normalized}";
    }

    private async Task<RepoSafetyScanResultDto> PerformRepoSafetyScan(string repoUrl)
    {
        var payload = JsonSerializer.Serialize(new { url = repoUrl }, RepoSafetyJsonOptions());
        var request = new HttpRequestMessage(HttpMethod.Post, "https://www.scanrepo.dev/api/scan")
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json"),
        };

        var client = _httpClientFactory.CreateClient();
        using var response = await client.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new UserFriendlyException("Repository scan failed. Try again later.");
        }

        var scanResult = ParseRepoSafetyResponse(body);
        if (scanResult?.Result == null)
        {
            throw new UserFriendlyException("Scan service returned an invalid response.");
        }

        return scanResult;
    }

    private static bool IsRepoSafe(RepoSafetyScanResultDto scanResult)
    {
        var result = scanResult?.Result;
        if (result == null)
        {
            return false;
        }

        var riskLevel = (result.RiskLevel ?? string.Empty).Trim().ToLowerInvariant();
        if (riskLevel is "high" or "critical")
        {
            return false;
        }

        var findings = result.Findings ?? new List<RepoSafetyFindingDto>();
        return findings.All(finding => !IsMaliciousFinding(finding));
    }

    private static bool IsMaliciousFinding(RepoSafetyFindingDto finding)
    {
        var severity = (finding?.Severity ?? string.Empty).Trim().ToLowerInvariant();
        if (severity is "high" or "critical")
        {
            return true;
        }

        var evidence = string.Join(" ", new[]
        {
            finding?.Category ?? string.Empty,
            finding?.Title ?? string.Empty,
            finding?.Description ?? string.Empty,
        }).ToLowerInvariant();

        return evidence.Contains("malicious") ||
               evidence.Contains("backdoor") ||
               evidence.Contains("trojan") ||
               evidence.Contains("ransomware") ||
               evidence.Contains("credential") ||
               evidence.Contains("stealer") ||
               evidence.Contains("command and control") ||
               evidence.Contains("payload");
    }

    private static RepoSafetyScanResultDto ParseRepoSafetyResponse(string payload)
    {
        var scan = new RepoSafetyScanResultDto();
        if (string.IsNullOrWhiteSpace(payload))
        {
            return scan;
        }

        if (TryParseRepoSafetyDocument(payload, scan))
        {
            return scan;
        }

        using var reader = new StringReader(payload);
        string line;
        while ((line = reader.ReadLine()) != null)
        {
            var trimmed = line.Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
            {
                continue;
            }

            TryParseRepoSafetyDocument(trimmed, scan);
        }

        return scan;
    }

    private static bool TryParseRepoSafetyDocument(string json, RepoSafetyScanResultDto scan)
    {
        try
        {
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;
            if (root.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in root.EnumerateArray())
                {
                    AppendRepoSafetyItem(scan, item);
                }

                return true;
            }

            AppendRepoSafetyItem(scan, root);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static void AppendRepoSafetyItem(RepoSafetyScanResultDto scan, JsonElement element)
    {
        var options = RepoSafetyJsonOptions();
        if (element.ValueKind != JsonValueKind.Object)
        {
            return;
        }

        if (element.TryGetProperty("type", out var typeElement))
        {
            var type = typeElement.GetString();
            if (string.Equals(type, "progress", StringComparison.OrdinalIgnoreCase))
            {
                var step = element.TryGetProperty("step", out var stepElement)
                    ? stepElement.GetString()
                    : string.Empty;
                var progress = element.TryGetProperty("progress", out var progressElement)
                    ? progressElement.GetDouble()
                    : 0;

                scan.Progress.Add(new RepoSafetyProgressDto
                {
                    Step = step ?? string.Empty,
                    Progress = (int)Math.Round(progress, MidpointRounding.AwayFromZero),
                });
                return;
            }

            if (string.Equals(type, "result", StringComparison.OrdinalIgnoreCase))
            {
                var dataElement = element.TryGetProperty("data", out var dataValue)
                    ? dataValue
                    : element;
                scan.Result = JsonSerializer.Deserialize<RepoSafetyResultDto>(
                    dataElement.GetRawText(),
                    options);
                return;
            }
        }

        if (element.TryGetProperty("riskScore", out _))
        {
            scan.Result = JsonSerializer.Deserialize<RepoSafetyResultDto>(
                element.GetRawText(),
                options);
        }
    }

    private static JsonSerializerOptions RepoSafetyJsonOptions()
    {
        return new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        };
    }

    private static GithubRepositoryDto MapGithubRepository(GithubApiRepository repository)
    {
        return new GithubRepositoryDto
        {
            Name = repository.Name ?? string.Empty,
            FullName = repository.FullName ?? string.Empty,
            HtmlUrl = repository.HtmlUrl ?? string.Empty,
            IsPrivate = repository.Private,
            DefaultBranch = repository.DefaultBranch ?? string.Empty,
        };
    }

    private static string ExtractGithubError(string payload)
    {
        if (string.IsNullOrWhiteSpace(payload))
        {
            return null;
        }

        try
        {
            var error = JsonSerializer.Deserialize<GithubApiError>(payload, GithubJsonOptions());
            return string.IsNullOrWhiteSpace(error?.Message)
                ? null
                : error.Message;
        }
        catch
        {
            return null;
        }
    }

    private static JsonSerializerOptions GithubJsonOptions()
    {
        return new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        };
    }

    private async Task<List<DeveloperProjectDto>> MapProjects(List<Project> projects)
    {
        if (projects.Count == 0)
        {
            return new List<DeveloperProjectDto>();
        }

        var projectIds = projects.Select(x => x.Id).ToList();
        var members = await _projectMemberRepository.GetAll()
            .Where(x => projectIds.Contains(x.ProjectId))
            .ToListAsync();

        var tasks = await _projectTaskRepository.GetAll()
            .Where(x => projectIds.Contains(x.ProjectId))
            .OrderBy(x => x.CreationTime)
            .ToListAsync();

        var developerIds = members.Select(x => x.DeveloperId).Distinct().ToList();
        var skills = await _projectSkillRepository.GetAll()
            .Where(x => projectIds.Contains(x.ProjectId))
            .ToListAsync();
        var developers = await _developerRepository.GetAll()
            .Where(x => developerIds.Contains(x.Id))
            .ToListAsync();

        var userIds = developers.Select(x => x.UserId).Distinct().ToList();
        var users = await _userRepository.GetAll()
            .Where(x => userIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x);

        return projects.Select(project =>
        {
            var projectMembers = members
                .Where(x => x.ProjectId == project.Id)
                .ToList();

            var memberDtos = projectMembers.Select(member =>
            {
                var memberDeveloper = developers.FirstOrDefault(x => x.Id == member.DeveloperId);
                users.TryGetValue(memberDeveloper?.UserId ?? 0, out var user);
                var fullName = string.Join(" ", new[] { user?.Name, user?.Surname }.Where(x => !string.IsNullOrWhiteSpace(x)));

                return new DeveloperProjectMemberDto
                {
                    Id = member.DeveloperId,
                    Name = string.IsNullOrWhiteSpace(fullName) ? user?.UserName ?? "Developer" : fullName,
                    UserName = user?.UserName ?? string.Empty,
                    Avatar = user?.AvatarUrl ?? string.Empty,
                    Role = member.Role == MemberRole.Lead ? "lead" : "member",
                    IsMentor = member.IsMentor,
                };
            }).ToList();
            var memberNameMap = memberDtos.ToDictionary(x => x.Id, x => x.Name);

            var taskDtos = tasks
                .Where(x => x.ProjectId == project.Id)
                .Select(task => new DeveloperProjectTaskDto
                {
                    Id = task.Id.ToString(),
                    Title = task.Title,
                    Description = task.Description,
                    Status = ToTaskStatusLabel(task.Status),
                    AssignedMemberId = task.AssignedDeveloperId?.ToString() ?? string.Empty,
                    AssignedMemberName = task.AssignedDeveloperId.HasValue &&
                        memberNameMap.TryGetValue(task.AssignedDeveloperId.Value, out var assignedName)
                        ? assignedName
                        : string.Empty,
                })
                .ToList();

            return new DeveloperProjectDto
            {
                Id = project.Id,
                Title = project.Title,
                Description = project.Description,
                MaxMembers = project.MaxMembers,
                Difficulty = project.Difficulty.ToString().ToLowerInvariant(),
                EstimatedHoursPerWeek = project.EstimatedHoursPerWeek,
                WorkloadScore = CalculateProjectWorkloadScore(project),
                GithubRepo = project.GithubRepo,
                Skills = skills
                    .Where(x => x.ProjectId == project.Id)
                    .Select(x => x.Name)
                    .ToList(),
                Type = project.Type.ToString().ToLowerInvariant(),
                Status = ToStatusLabel(project.Status),
                OwnerId = project.OwnerDeveloperId.ToString(),
                CreatedAt = project.CreationTime,
                Members = memberDtos,
                Tasks = taskDtos,
            };
        }).ToList();
    }

    private async Task<List<long>> ResolveProjectMemberUserIds(Guid projectId)
    {
        var memberDeveloperIds = await _projectMemberRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .Select(x => x.DeveloperId)
            .Distinct()
            .ToListAsync();
        if (memberDeveloperIds.Count == 0)
        {
            return new List<long>();
        }

        return await _developerRepository.GetAll()
            .Where(x => memberDeveloperIds.Contains(x.Id))
            .Select(x => x.UserId)
            .Distinct()
            .ToListAsync();
    }

    private async Task<ProjectMatchSelection> SelectProjectWithGroq(
        List<DeveloperProjectDto> openProjects,
        List<string> developerSkills,
        List<string> developerGoals)
    {
        if (!_groqChatService.IsConfigured())
        {
            return null;
        }

        var payload = new
        {
            developer = new
            {
                skills = developerSkills,
                goals = developerGoals,
            },
            projects = openProjects.Select(project => new
            {
                id = project.Id,
                title = project.Title,
                description = project.Description,
                skills = project.Skills,
                status = project.Status,
                maxMembers = project.MaxMembers,
                currentMembers = project.Members.Count,
            }),
        };

        var systemPrompt = "You are a project matching assistant. Return only JSON with {\"projectId\":\"<guid or empty>\",\"insight\":\"short reason\",\"learningOutcomes\":[\"item\"]}.";
        var userPrompt = JsonSerializer.Serialize(payload);
        var response = await _groqChatService.TryCompleteAsync(systemPrompt, userPrompt);
        if (string.IsNullOrWhiteSpace(response))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(response);
            if (!document.RootElement.TryGetProperty("projectId", out var projectIdElement))
            {
                return null;
            }

            if (!Guid.TryParse(projectIdElement.GetString(), out var projectId))
            {
                return null;
            }

            if (!openProjects.Any(x => x.Id == projectId))
            {
                return null;
            }

            var insight = document.RootElement.TryGetProperty("insight", out var insightElement)
                ? insightElement.GetString()
                : null;
            var learningOutcomes = new List<string>();
            if (document.RootElement.TryGetProperty("learningOutcomes", out var learningElement) &&
                learningElement.ValueKind == JsonValueKind.Array)
            {
                learningOutcomes = learningElement
                    .EnumerateArray()
                    .Select(x => x.GetString())
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .ToList();
            }

            return new ProjectMatchSelection
            {
                ProjectId = projectId,
                Insight = insight,
                LearningOutcomes = learningOutcomes,
            };
        }
        catch
        {
            return null;
        }
    }

    private static int ScoreProjectMatch(
        DeveloperProjectDto project,
        IReadOnlyCollection<string> developerSkills,
        IReadOnlyCollection<string> developerGoals)
    {
        return CalculateMatchScore(project, developerSkills, developerGoals);
    }

    private static int CalculateMatchScore(
        DeveloperProjectDto project,
        IReadOnlyCollection<string> developerSkills,
        IReadOnlyCollection<string> developerGoals)
    {
        var normalizedDeveloperSkills = developerSkills
            .Where(skill => !string.IsNullOrWhiteSpace(skill))
            .Select(NormalizeSkillToken)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        var normalizedProjectSkills = project.Skills
            .Where(skill => !string.IsNullOrWhiteSpace(skill))
            .Select(NormalizeSkillToken)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var overlap = normalizedProjectSkills.Count(projectSkill =>
            normalizedDeveloperSkills.Any(devSkill => SkillTokensMatch(devSkill, projectSkill)));
        var totalProjectSkills = Math.Max(normalizedProjectSkills.Count, 1);
        var skillCoverage = (double)overlap / totalProjectSkills;

        var goalsCount = Math.Max(developerGoals.Count, 1);
        var projectText = $"{project.Title} {project.Description} {string.Join(" ", project.Skills)}";
        var goalHits = developerGoals.Count(goal =>
            !string.IsNullOrWhiteSpace(goal) &&
            ContainsRelaxed(projectText, goal));
        var goalCoverage = (double)goalHits / goalsCount;

        var maxMembers = project.MaxMembers.GetValueOrDefault(4);
        if (maxMembers <= 0)
        {
            maxMembers = 4;
        }
        var availableSlots = Math.Max(maxMembers - project.Members.Count, 0);
        var availabilityRatio = (double)availableSlots / Math.Max(maxMembers, 1);

        var weighted =
            (Math.Min(skillCoverage, 1) * 0.75) +
            (Math.Min(goalCoverage, 1) * 0.15) +
            (Math.Min(availabilityRatio, 1) * 0.1);

        var boosted = 35 + (weighted * 65);
        if (overlap > 0 && boosted < 55)
        {
            boosted = 55;
        }

        if (overlap >= Math.Max(1, totalProjectSkills - 1) && goalHits > 0)
        {
            boosted = Math.Max(boosted, 85);
        }

        var capped = Math.Min(boosted, 100);
        return (int)Math.Round(capped, MidpointRounding.AwayFromZero);
    }

    private static string NormalizeSkillToken(string value)
    {
        var token = value.Trim().ToLowerInvariant();
        return token switch
        {
            "js" => "javascript",
            "node" => "nodejs",
            "node.js" => "nodejs",
            "ts" => "typescript",
            "py" => "python",
            "postgres" => "postgresql",
            "c#" => "dotnet",
            ".net" => "dotnet",
            "asp.net" => "dotnet",
            _ => token,
        };
    }

    private static bool SkillTokensMatch(string developerSkill, string projectSkill)
    {
        if (string.Equals(developerSkill, projectSkill, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return developerSkill.Contains(projectSkill, StringComparison.OrdinalIgnoreCase) ||
               projectSkill.Contains(developerSkill, StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsRelaxed(string haystack, string needle)
    {
        if (string.IsNullOrWhiteSpace(haystack) || string.IsNullOrWhiteSpace(needle))
        {
            return false;
        }

        var normalizedHaystack = NormalizeText(haystack);
        var normalizedNeedle = NormalizeText(needle);
        return normalizedHaystack.Contains(normalizedNeedle, StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeText(string value)
    {
        var normalized = value.Trim().ToLowerInvariant();
        normalized = normalized
            .Replace("node.js", "nodejs")
            .Replace("node js", "nodejs")
            .Replace("javascript", "javascript")
            .Replace(" js ", " javascript ")
            .Replace("typescript", "typescript")
            .Replace(" ts ", " typescript ")
            .Replace("postgres", "postgresql")
            .Replace("asp.net", "dotnet")
            .Replace(".net", "dotnet")
            .Replace("c#", "dotnet");

        return normalized;
    }

    private async Task<HashSet<Guid>> SelectCandidatesWithGroq(Guid projectId, List<Developer> candidates, int availableSlots)
    {
        if (!_groqChatService.IsConfigured() || availableSlots <= 0 || candidates.Count == 0)
        {
            return new HashSet<Guid>();
        }

        var projectSkills = await _projectSkillRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .Select(x => x.Name)
            .ToListAsync();

        var candidateProfiles = await BuildCandidateProfiles(candidates);

        var payload = new
        {
            slots = availableSlots,
            projectSkills,
            candidates = candidateProfiles.Select(x => new
            {
                id = x.DeveloperId,
                yearsOfExperience = x.YearsOfExperience,
                teamworkRating = x.TeamworkRating,
                skills = x.Skills,
            }),
        };

        var systemPrompt = "Pick the best candidates for the project. Return only JSON: {\"developerIds\":[\"<guid>\"]}.";
        var userPrompt = JsonSerializer.Serialize(payload);
        var response = await _groqChatService.TryCompleteAsync(systemPrompt, userPrompt);
        if (string.IsNullOrWhiteSpace(response))
        {
            return new HashSet<Guid>();
        }

        try
        {
            using var document = JsonDocument.Parse(response);
            if (!document.RootElement.TryGetProperty("developerIds", out var idsElement) ||
                idsElement.ValueKind != JsonValueKind.Array)
            {
                return new HashSet<Guid>();
            }

            var allowed = candidates.Select(x => x.Id).ToHashSet();
            var selected = new HashSet<Guid>();
            foreach (var idValue in idsElement.EnumerateArray())
            {
                if (Guid.TryParse(idValue.GetString(), out var parsedId) && allowed.Contains(parsedId))
                {
                    selected.Add(parsedId);
                    if (selected.Count >= availableSlots)
                    {
                        break;
                    }
                }
            }

            return selected;
        }
        catch
        {
            return new HashSet<Guid>();
        }
    }

    private async Task<List<Developer>> RankCandidatesBySkills(Guid projectId, List<Developer> candidates)
    {
        if (candidates.Count == 0)
        {
            return new List<Developer>();
        }

        var projectSkills = await _projectSkillRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .Select(x => x.Name)
            .ToListAsync();
        var projectSkillSet = new HashSet<string>(projectSkills, StringComparer.OrdinalIgnoreCase);
        var candidateProfiles = await BuildCandidateProfiles(candidates);

        var rankedIds = candidateProfiles
            .OrderByDescending(candidate => candidate.Skills.Count(skill => projectSkillSet.Contains(skill)))
            .ThenByDescending(candidate => candidate.TeamworkRating)
            .ThenByDescending(candidate => candidate.YearsOfExperience ?? 0)
            .Select(candidate => candidate.DeveloperId)
            .ToList();

        var idOrder = rankedIds
            .Select((id, index) => new { id, index })
            .ToDictionary(x => x.id, x => x.index);

        return candidates
            .OrderBy(candidate => idOrder.TryGetValue(candidate.Id, out var index) ? index : int.MaxValue)
            .ToList();
    }

    private async Task<List<DeveloperCandidateProfile>> BuildCandidateProfiles(List<Developer> candidates)
    {
        var candidateIds = candidates.Select(x => x.Id).ToList();

        var profiles = await _developerProfileRepository.GetAll()
            .Where(x => candidateIds.Contains(x.DeveloperId))
            .ToListAsync();

        var profileIds = profiles.Select(x => x.Id).ToList();
        var profileSkills = await _developerProfileSkillRepository.GetAll()
            .Where(x => profileIds.Contains(x.ProfileId))
            .ToListAsync();

        return candidates.Select(candidate =>
        {
            var profile = profiles.FirstOrDefault(x => x.DeveloperId == candidate.Id);
            var skills = profile == null
                ? new List<string>()
                : profileSkills
                    .Where(x => x.ProfileId == profile.Id)
                    .Select(x => x.Name)
                    .ToList();

            return new DeveloperCandidateProfile
            {
                DeveloperId = candidate.Id,
                YearsOfExperience = candidate.YearsOfExperience,
                TeamworkRating = profile?.TeamworkRating ?? 0,
                Skills = skills,
            };
        }).ToList();
    }

    private async Task<List<string>> GetDeveloperSkills(Guid developerId)
    {
        var profile = await _developerProfileRepository.GetAll()
            .FirstOrDefaultAsync(x => x.DeveloperId == developerId);

        if (profile == null)
        {
            return new List<string>();
        }

        return await _developerProfileSkillRepository.GetAll()
            .Where(x => x.ProfileId == profile.Id)
            .Select(x => x.Name)
            .ToListAsync();
    }

    private async Task<List<string>> GetDeveloperGoals(Guid developerId)
    {
        var profile = await _developerProfileRepository.GetAll()
            .FirstOrDefaultAsync(x => x.DeveloperId == developerId);

        if (profile == null)
        {
            return new List<string>();
        }

        return await _developerProfileGoalRepository.GetAll()
            .Where(x => x.ProfileId == profile.Id)
            .Select(x => x.Goal)
            .ToListAsync();
    }

    private class GithubApiRepository
    {
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("full_name")]
        public string FullName { get; set; }

        [JsonPropertyName("html_url")]
        public string HtmlUrl { get; set; }

        [JsonPropertyName("private")]
        public bool Private { get; set; }

        [JsonPropertyName("default_branch")]
        public string DefaultBranch { get; set; }
    }

    private class GithubApiError
    {
        public string Message { get; set; }
    }

    private class DeveloperCandidateProfile
    {
        public Guid DeveloperId { get; set; }
        public int? YearsOfExperience { get; set; }
        public double TeamworkRating { get; set; }
        public List<string> Skills { get; set; } = new();
    }

    private class ProjectMatchSelection
    {
        public Guid? ProjectId { get; set; }
        public string Insight { get; set; }
        public List<string> LearningOutcomes { get; set; } = new();
    }

    private static string BuildFallbackInsight(
        DeveloperProjectDto project,
        IReadOnlyCollection<string> developerSkills,
        IReadOnlyCollection<string> developerGoals)
    {
        var skillSet = new HashSet<string>(developerSkills, StringComparer.OrdinalIgnoreCase);
        var overlaps = project.Skills.Where(skill => skillSet.Contains(skill)).Take(3).ToList();
        var goalHint = developerGoals.FirstOrDefault(goal =>
            !string.IsNullOrWhiteSpace(goal) &&
            project.Description.Contains(goal, StringComparison.OrdinalIgnoreCase));

        if (overlaps.Count > 0 && !string.IsNullOrWhiteSpace(goalHint))
        {
            return $"Strong overlap with your skills ({string.Join(", ", overlaps)}) and aligns with your goal: {goalHint}.";
        }

        if (overlaps.Count > 0)
        {
            return $"Strong overlap with your current skills: {string.Join(", ", overlaps)}.";
        }

        if (!string.IsNullOrWhiteSpace(goalHint))
        {
            return $"This project aligns with your stated goal: {goalHint}.";
        }

        return "This project offers the best available fit based on your profile and open team slots.";
    }

    private static List<string> BuildFallbackLearningOutcomes(
        DeveloperProjectDto project,
        IReadOnlyCollection<string> developerSkills)
    {
        var skillSet = new HashSet<string>(developerSkills, StringComparer.OrdinalIgnoreCase);
        var newSkills = project.Skills.Where(skill => !skillSet.Contains(skill)).Take(3).ToList();

        if (newSkills.Count > 0)
        {
            return newSkills.Select(skill => $"Build practical experience in {skill}.").ToList();
        }

        return new List<string>
        {
            "Deepen collaboration in a real delivery team.",
            "Improve project execution from planning to completion.",
        };
    }

    private static string ToStatusLabel(ProjectStatus status)
    {
        return status switch
        {
            ProjectStatus.Draft => "draft",
            ProjectStatus.InProgress => "in-progress",
            ProjectStatus.Complete => "completed",
            _ => "open",
        };
    }

    private static string ToTaskStatusLabel(ProjectTaskStatus status)
    {
        return status switch
        {
            ProjectTaskStatus.InProgress => "in-progress",
            ProjectTaskStatus.Done => "done",
            _ => "todo",
        };
    }

    private static string ToProjectInviteStatusLabel(ProjectTeamInviteStatus status)
    {
        return status switch
        {
            ProjectTeamInviteStatus.Accepted => "accepted",
            ProjectTeamInviteStatus.Rejected => "rejected",
            _ => "pending",
        };
    }

    private static MemberRole ParseMemberRole(string input)
    {
        var normalized = input?.Trim().ToLowerInvariant();
        return normalized switch
        {
            "lead" => MemberRole.Lead,
            "member" => MemberRole.Member,
            _ => throw new UserFriendlyException("Invalid member role."),
        };
    }

    private static ProjectTaskStatus ParseTaskStatus(string input)
    {
        var normalized = input?.Trim().ToLowerInvariant();

        return normalized switch
        {
            "todo" => ProjectTaskStatus.Todo,
            "in-progress" => ProjectTaskStatus.InProgress,
            "done" => ProjectTaskStatus.Done,
            _ => throw new UserFriendlyException("Invalid task status."),
        };
    }
}
