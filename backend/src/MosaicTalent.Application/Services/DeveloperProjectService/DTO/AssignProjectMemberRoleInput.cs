using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class AssignProjectMemberRoleInput
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    public Guid MemberId { get; set; }

    [Required]
    [MaxLength(32)]
    public string Role { get; set; }
}
