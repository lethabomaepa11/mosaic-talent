namespace MosaicTalent.Domains.Projects;

public static class ProjectVisibilityPolicy
{
    public static bool CanView(bool isPublic, bool isOwner, bool isMember, bool hasPendingInvite) =>
        isPublic || isOwner || isMember || hasPendingInvite;
}
