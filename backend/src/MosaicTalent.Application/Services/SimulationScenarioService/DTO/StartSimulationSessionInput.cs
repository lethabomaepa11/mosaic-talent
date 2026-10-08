using System;

namespace MosaicTalent.Services.SimulationScenarioService.DTO;

public class StartSimulationSessionInput
{
    public Guid ScenarioId { get; set; }
    public string SessionType { get; set; }
}
