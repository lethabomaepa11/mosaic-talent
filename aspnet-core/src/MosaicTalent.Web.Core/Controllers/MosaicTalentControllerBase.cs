using Abp.AspNetCore.Mvc.Controllers;
using Abp.IdentityFramework;
using Microsoft.AspNetCore.Identity;

namespace MosaicTalent.Controllers
{
    public abstract class MosaicTalentControllerBase : AbpController
    {
        protected MosaicTalentControllerBase()
        {
            LocalizationSourceName = MosaicTalentConsts.LocalizationSourceName;
        }

        protected void CheckErrors(IdentityResult identityResult)
        {
            identityResult.CheckErrors(LocalizationManager);
        }
    }
}
