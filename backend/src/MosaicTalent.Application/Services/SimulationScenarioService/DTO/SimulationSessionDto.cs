using System;
using System.Collections.Generic;

namespace MosaicTalent.Services.SimulationScenarioService.DTO;

public class SimulationSessionDto
{
    public Guid Id { get; set; }
    public Guid ScenarioId { get; set; }
    public string ScenarioTitle { get; set; }
    public string SessionType { get; set; }
    public bool OrchestratorNeeded { get; set; }
    public bool AwaitingUserInput { get; set; }
    public List<ScenarioMessageDto> Messages { get; set; } = new();
    public List<SimulationBotDto> Bots { get; set; } = new();
    public List<OrchestratorLogDto> OrchestratorLogs { get; set; } = new();
    public List<AssessorObservationDto> Observations { get; set; } = new();
}
