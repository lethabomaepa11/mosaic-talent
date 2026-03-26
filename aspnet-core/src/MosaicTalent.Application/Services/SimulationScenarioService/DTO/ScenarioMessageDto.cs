using System;

namespace MosaicTalent.Services.SimulationScenarioService.DTO;

public class ScenarioMessageDto
{
    public Guid Id { get; set; }
    public string Role { get; set; }
    public string Content { get; set; }
    public DateTime CreatedAt { get; set; }
}
