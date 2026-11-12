using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.BuildJourneyService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MosaicTalent.Services.BuildJourneyService;

public partial class BuildJourneyAppService
{
    public async Task<List<BuildInvitationDto>> GetMyInvitations()
    {
        var developer = await CurrentDeveloper();
        // Tenant and soft-delete filters apply to both sides of this query.
        return await (from invite in _invites.GetAll()
                      join project in _projects.GetAll() on invite.ProjectId equals project.Id
                      where invite.DeveloperId == developer.Id
                          && invite.Status == ProjectTeamInviteStatus.Pending
                          && project.Status == ProjectStatus.Open
                      orderby invite.CreationTime descending
                      select new BuildInvitationDto
                      {
                          Id = invite.Id, ProjectId = project.Id, ProjectTitle = project.Title,
                          EstimatedHoursPerWeek = project.EstimatedHoursPerWeek
                      }).ToListAsync();
    }

    public async Task InviteMember(InviteBuildMemberInput input)
    {
        if (input == null || input.ProjectId == Guid.Empty || string.IsNullOrWhiteSpace(input.UserName))
            throw new UserFriendlyException("Choose a developer to invite.");
        var sender = await CurrentDeveloper();
        var membership = await EnsureActiveMember(input.ProjectId, sender.Id);
        var project = await _projects.GetAsync(input.ProjectId);
        if (project.OwnerDeveloperId != sender.Id && membership.Role != MemberRole.Lead)
            throw new UserFriendlyException("Only project leads can invite teammates.");
        if (project.Status != ProjectStatus.Open)
            throw new UserFriendlyException("Only open projects can invite teammates.");

        var userName = input.UserName.Trim().ToUpperInvariant();
        var recipient = await (from developer in _developers.GetAll()
                               join user in _users.GetAll() on developer.UserId equals user.Id
                               where user.UserName.ToUpper() == userName && user.IsActive
                               select developer).FirstOrDefaultAsync()
            ?? throw new UserFriendlyException("Developer not found. Choose an existing developer account.");
        if (await _members.GetAll().AnyAsync(x => x.ProjectId == project.Id && x.DeveloperId == recipient.Id))
            throw new UserFriendlyException("This developer is already on the team.");

        // Serialize manual invitation writes for this project within the transactional unit of work.
        await _projects.GetAll().Where(x => x.Id == project.Id)
            .ExecuteUpdateAsync(update => update.SetProperty(x => x.LastModificationTime, (DateTime?)DateTime.UtcNow));
        if (await _invites.GetAll().AnyAsync(x => x.ProjectId == project.Id && x.DeveloperId == recipient.Id
            && x.Status == ProjectTeamInviteStatus.Pending)) return;
        var memberCount = await _members.GetAll().CountAsync(x => x.ProjectId == project.Id);
        var pendingCount = await _invites.GetAll().CountAsync(x => x.ProjectId == project.Id && x.Status == ProjectTeamInviteStatus.Pending);
        if (memberCount + pendingCount >= (project.MaxMembers ?? 8))
            throw new UserFriendlyException("The team is full, including pending invitations.");
        await _invites.InsertAsync(new ProjectTeamInvite
        {
            TenantId = project.TenantId, ProjectId = project.Id, DeveloperId = recipient.Id,
            InvitedByDeveloperId = sender.Id, Status = ProjectTeamInviteStatus.Pending
        });
        await CurrentUnitOfWork.SaveChangesAsync();
        try { await _inviteNotifications.NotifyDeveloperAboutInviteAsync(project, recipient, sender, project.TenantId); }
        catch (Exception error) { Logger.Warn("Invitation saved; notification delivery failed.", error); }
    }
}
