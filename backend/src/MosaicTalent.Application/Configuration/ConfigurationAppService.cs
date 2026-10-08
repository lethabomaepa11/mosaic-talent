using Abp.Authorization;
using Abp.Runtime.Session;
using MosaicTalent.Configuration.Dto;
using System.Threading.Tasks;

namespace MosaicTalent.Configuration;

[AbpAuthorize]
public class ConfigurationAppService : MosaicTalentAppServiceBase, IConfigurationAppService
{
    public async Task ChangeUiTheme(ChangeUiThemeInput input)
    {
        await SettingManager.ChangeSettingForUserAsync(AbpSession.ToUserIdentifier(), AppSettingNames.UiTheme, input.Theme);
    }
}
