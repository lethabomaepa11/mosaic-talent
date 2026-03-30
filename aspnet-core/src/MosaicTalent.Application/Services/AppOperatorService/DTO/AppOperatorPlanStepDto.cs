using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.AppOperatorService.DTO;

public class AppOperatorPlanStepDto
{
    [MaxLength(240)]
    public string Id { get; set; }

    [Required]
    [MaxLength(400)]
    public string Title { get; set; }
}
