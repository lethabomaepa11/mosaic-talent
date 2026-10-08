using System;
using System.Collections.Generic;

namespace MosaicTalent.Services.SimulationScenarioService.DTO;

public class SimulationScenarioDto
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public string Prompt { get; set; }
    public int BotCount { get; set; }
    public List<string> RequiredRoles { get; set; } = new();
}
