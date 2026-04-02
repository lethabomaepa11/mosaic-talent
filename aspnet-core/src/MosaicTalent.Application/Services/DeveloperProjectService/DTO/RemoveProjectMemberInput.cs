using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class RemoveProjectMemberInput
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    public Guid MemberId { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Reason { get; set; }
}
