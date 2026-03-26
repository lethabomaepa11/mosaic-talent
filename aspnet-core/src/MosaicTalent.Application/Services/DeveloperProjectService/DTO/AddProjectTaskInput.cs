using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class AddProjectTaskInput
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    [MaxLength(180)]
    public string Title { get; set; }

    [MaxLength(2000)]
    public string Description { get; set; }
}
