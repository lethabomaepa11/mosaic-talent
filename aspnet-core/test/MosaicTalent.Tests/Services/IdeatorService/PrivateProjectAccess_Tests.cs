using MosaicTalent.Domains.Projects;
using Shouldly;
using Xunit;

namespace MosaicTalent.Tests.Services.IdeatorService;

public class PrivateProjectAccess_Tests
{
    [Fact]
    public void Public_projects_can_be_viewed_by_authenticated_developers()
    {
        ProjectVisibilityPolicy.CanView(isPublic: true, isOwner: false, isMember: false, hasPendingInvite: false).ShouldBeTrue();
    }

    [Fact]
    public void Private_projects_require_ownership_membership_or_a_pending_invite()
    {
        ProjectVisibilityPolicy.CanView(isPublic: false, isOwner: false, isMember: false, hasPendingInvite: false).ShouldBeFalse();
        ProjectVisibilityPolicy.CanView(isPublic: false, isOwner: true, isMember: false, hasPendingInvite: false).ShouldBeTrue();
        ProjectVisibilityPolicy.CanView(isPublic: false, isOwner: false, isMember: true, hasPendingInvite: false).ShouldBeTrue();
        ProjectVisibilityPolicy.CanView(isPublic: false, isOwner: false, isMember: false, hasPendingInvite: true).ShouldBeTrue();
    }
}
