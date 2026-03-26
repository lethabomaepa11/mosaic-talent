using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class UpdateProjectSkillsInput
{
    [Required]
    public Guid ProjectId { get; set; }

    public List<string> Skills { get; set; } = new();
}
