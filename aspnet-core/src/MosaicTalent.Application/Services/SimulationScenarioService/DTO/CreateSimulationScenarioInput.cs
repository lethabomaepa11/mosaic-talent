using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.SimulationScenarioService.DTO;

public class CreateSimulationScenarioInput
{
    [Required]
    [MaxLength(160)]
    public string Title { get; set; }

    [Required]
    [MaxLength(3000)]
    public string Prompt { get; set; }

    [Range(1, 8)]
    public int BotCount { get; set; }

    public List<string> RequiredRoles { get; set; } = new();
}
