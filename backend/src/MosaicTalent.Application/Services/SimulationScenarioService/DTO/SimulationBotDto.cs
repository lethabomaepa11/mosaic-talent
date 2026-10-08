using System;

namespace MosaicTalent.Services.SimulationScenarioService.DTO;

public class SimulationBotDto
{
    public Guid Id { get; set; }
    public string Role { get; set; }
    public string PersonalityPrompt { get; set; }
    public string CurrentState { get; set; }
    public bool IsActive { get; set; }
    public int? TurnOrder { get; set; }
}
