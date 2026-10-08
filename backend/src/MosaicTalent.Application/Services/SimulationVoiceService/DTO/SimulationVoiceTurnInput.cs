using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.SimulationVoiceService.DTO;

public class SimulationVoiceTurnInput
{
    public Guid SessionId { get; set; }

    [Required]
    [MaxLength(4000)]
    public string Content { get; set; }
}
