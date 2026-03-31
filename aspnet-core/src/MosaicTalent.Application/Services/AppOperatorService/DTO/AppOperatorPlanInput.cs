using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.AppOperatorService.DTO;

public class AppOperatorPlanInput
{
    [Required]
    [MaxLength(1200)]
    public string Command { get; set; }

    [MaxLength(256)]
    public string CurrentPath { get; set; }

    public List<AppOperatorRouteDescriptorDto> Routes { get; set; } = new();

    public List<AppOperatorActionDescriptorDto> Actions { get; set; } = new();
}
