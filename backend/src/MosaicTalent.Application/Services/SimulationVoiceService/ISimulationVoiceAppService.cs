using Abp.Application.Services;
using MosaicTalent.Services.SimulationVoiceService.DTO;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace MosaicTalent.Services.SimulationVoiceService;

public interface ISimulationVoiceAppService : IApplicationService
{
    Task<List<SimulationVoiceModelDto>> GetVoiceModels();
    Task<SimulationVoiceTurnDto> Turn(SimulationVoiceTurnInput input);
}
