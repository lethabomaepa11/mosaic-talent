using MosaicTalent.Configuration.Dto;
using System.Threading.Tasks;

namespace MosaicTalent.Configuration;

public interface IConfigurationAppService
{
    Task ChangeUiTheme(ChangeUiThemeInput input);
}
