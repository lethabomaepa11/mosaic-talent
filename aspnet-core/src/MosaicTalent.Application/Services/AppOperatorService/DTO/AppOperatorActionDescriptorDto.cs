using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.AppOperatorService.DTO;

public class AppOperatorActionDescriptorDto
{
    [Required]
    [MaxLength(120)]
    public string Id { get; set; }

    [MaxLength(200)]
    public string Name { get; set; }

    [MaxLength(1200)]
    public string Description { get; set; }

    [MaxLength(120)]
    public string RouteKey { get; set; }

    public List<string> RequiredInputs { get; set; } = new();

    public List<string> OptionalInputs { get; set; } = new();

    public bool RequiresConfirmation { get; set; }
}
