using Abp.Application.Services;
using MosaicTalent.Services.SimulationScenarioService.DTO;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MosaicTalent.Services.SimulationScenarioService;

public interface ISimulationScenarioAppService : IApplicationService
{
    Task<List<SimulationScenarioDto>> GetScenarios();
    Task<SimulationScenarioDto> CreateScenario(CreateSimulationScenarioInput input);
    Task<SimulationSessionDto> StartSession(StartSimulationSessionInput input);
    Task<SimulationSessionDto> GetSession(GetSimulationSessionInput input);
    Task<SimulationSessionDto> AdvanceSession(GetSimulationSessionInput input);
    Task<SimulationSessionDto> SendMessage(SendScenarioMessageInput input);
    Task<SimulationFeedbackDto> EvaluateSession(GetSimulationSessionInput input);
}
