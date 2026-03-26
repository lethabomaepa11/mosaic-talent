using System;

namespace MosaicTalent.Services.SimulationScenarioService.DTO;

public class OrchestratorLogDto
{
    public int TurnIndex { get; set; }
    public string NextBotRole { get; set; }
    public bool CoherenceCheckPassed { get; set; }
    public string CoherenceNotes { get; set; }
    public DateTime Timestamp { get; set; }
}
