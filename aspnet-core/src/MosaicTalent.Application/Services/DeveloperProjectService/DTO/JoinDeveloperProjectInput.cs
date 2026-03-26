using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class JoinDeveloperProjectInput
{
    [Required]
    public Guid ProjectId { get; set; }
}
