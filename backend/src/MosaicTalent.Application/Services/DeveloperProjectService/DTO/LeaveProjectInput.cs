using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class LeaveProjectInput
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Reason { get; set; }
}
