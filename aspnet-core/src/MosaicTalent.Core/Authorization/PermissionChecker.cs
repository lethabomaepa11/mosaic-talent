using Abp.Authorization;
using MosaicTalent.Authorization.Roles;
using MosaicTalent.Authorization.Users;

namespace MosaicTalent.Authorization;

public class PermissionChecker : PermissionChecker<Role, User>
{
    public PermissionChecker(UserManager userManager)
        : base(userManager)
    {
    }
}
