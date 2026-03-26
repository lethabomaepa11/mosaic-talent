using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.SimulationScenarioService.DTO;

public class SendScenarioMessageInput
{
    public Guid SessionId { get; set; }

    [Required]
    [MaxLength(4000)]
    public string Content { get; set; }
}
