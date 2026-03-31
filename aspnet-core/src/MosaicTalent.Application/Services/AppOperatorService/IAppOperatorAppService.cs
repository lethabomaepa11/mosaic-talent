using Abp.Application.Services;
using MosaicTalent.Services.AppOperatorService.DTO;
using System.Threading.Tasks;

namespace MosaicTalent.Services.AppOperatorService;

public interface IAppOperatorAppService : IApplicationService
{
    Task<AppOperatorPlanDto> Plan(AppOperatorPlanInput input);
}
