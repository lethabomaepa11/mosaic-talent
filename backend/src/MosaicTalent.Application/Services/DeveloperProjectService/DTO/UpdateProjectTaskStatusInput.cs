using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class UpdateProjectTaskStatusInput
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    public Guid TaskId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; }
}
