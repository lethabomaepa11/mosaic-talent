using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class ReassignProjectTaskInput
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    public Guid TaskId { get; set; }

    public Guid? AssignedMemberId { get; set; }
}
