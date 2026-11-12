using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.UI;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.BuildJourneyService;
using MosaicTalent.Services.BuildJourneyService.DTO;
using MosaicTalent.Services.DeveloperOnboardingService;
using MosaicTalent.Services.DeveloperProjectService;
using MosaicTalent.Services.NotificationChannelService;
using NSubstitute;
using Shouldly;
using System;
using System.Threading.Tasks;
using Xunit;

namespace MosaicTalent.Tests.Services.BuildJourneyService;

public class BuildInvitation_Tests : MosaicTalentTestBase
{
    private BuildJourneyAppService Service() => new(
        Resolve<IRepository<Developer, Guid>>(), Resolve<IRepository<Project, Guid>>(),
        Resolve<IRepository<ProjectTask, Guid>>(), Resolve<IRepository<ProjectMember, Guid>>(),
        Resolve<IRepository<ProjectTeamInvite, Guid>>(), Resolve<IRepository<ProjectProgressEntry, Guid>>(),
        Resolve<IRepository<ProjectProgressReview, Guid>>(), Substitute.For<IDeveloperProjectAppService>(),
        Substitute.For<IDeveloperOnboardingAppService>(), Resolve<IRepository<User, long>>(),
        Substitute.For<IProjectJoinNotificationDispatcher>()) { AbpSession = AbpSession };

    [Fact]
    public async Task Inbox_only_returns_current_developers_pending_open_project_invitations()
    {
        var me = Guid.NewGuid(); var other = Guid.NewGuid();
        var open = Guid.NewGuid(); var complete = Guid.NewGuid();
        await UsingDbContextAsync(async db =>
        {
            db.Developers.Add(new Developer { Id = me, UserId = AbpSession.UserId.Value });
            db.Developers.Add(new Developer { Id = other, UserId = 987654 });
            db.Projects.Add(new Project { Id = open, TenantId = 1, Title = "Private invitation", Description = "Private", ProblemStatement = "Work together", Status = ProjectStatus.Open, OwnerDeveloperId = other });
            db.Projects.Add(new Project { Id = complete, TenantId = 1, Title = "Complete", Description = "Done", ProblemStatement = "Work together", Status = ProjectStatus.Complete, OwnerDeveloperId = other });
            foreach (var item in new[] { (me, open, ProjectTeamInviteStatus.Pending), (other, open, ProjectTeamInviteStatus.Pending),
                (me, complete, ProjectTeamInviteStatus.Pending), (me, open, ProjectTeamInviteStatus.Rejected) })
                db.ProjectTeamInvites.Add(new ProjectTeamInvite { Id = Guid.NewGuid(), TenantId = 1, DeveloperId = item.Item1, ProjectId = item.Item2, Status = item.Item3, InvitedByDeveloperId = other });
            await db.SaveChangesAsync();
        });
        using var uow = Resolve<IUnitOfWorkManager>().Begin();
        var inbox = await Service().GetMyInvitations();
        inbox.Count.ShouldBe(1); inbox[0].ProjectId.ShouldBe(open); inbox[0].ProjectTitle.ShouldBe("Private invitation");
        await uow.CompleteAsync();
    }

    [Fact]
    public async Task A_regular_member_cannot_invite_other_developers()
    {
        var me = Guid.NewGuid(); var project = Guid.NewGuid();
        await UsingDbContextAsync(async db =>
        {
            db.Developers.Add(new Developer { Id = me, UserId = AbpSession.UserId.Value });
            db.Projects.Add(new Project { Id = project, TenantId = 1, Title = "Team", Description = "Work", ProblemStatement = "Work together", Status = ProjectStatus.Open, OwnerDeveloperId = Guid.NewGuid() });
            db.ProjectMembers.Add(new ProjectMember { Id = Guid.NewGuid(), TenantId = 1, ProjectId = project, DeveloperId = me, Role = MemberRole.Member });
            await db.SaveChangesAsync();
        });
        using var uow = Resolve<IUnitOfWorkManager>().Begin();
        var error = await Should.ThrowAsync<UserFriendlyException>(() => Service().InviteMember(new InviteBuildMemberInput { ProjectId = project, UserName = "teammate" }));
        error.Message.ShouldContain("Only project leads");
    }
}
