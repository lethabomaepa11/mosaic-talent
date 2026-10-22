using System.ComponentModel.DataAnnotations;
using MosaicTalent.Domains.Projects;
using System.Collections.Generic;

namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class CreateDeveloperProjectInput
{
    [Required]
    [MaxLength(160)]
    public string Title { get; set; }

    [Required]
    [MaxLength(8000)]
    public string Description { get; set; }

    [Required]
    [MaxLength(4000)]
    public string ProblemStatement { get; set; }

    public bool IsPublic { get; set; }

    [Range(2, 8)]
    public int? MaxMembers { get; set; }

    [MaxLength(256)]
    public string GithubRepo { get; set; }

    public ProjectDifficulty Difficulty { get; set; } = ProjectDifficulty.Intermediate;

    [Range(1, 40)]
    public int EstimatedHoursPerWeek { get; set; } = 6;

    public List<string> Skills { get; set; } = new();

    public ProjectType Type { get; set; } = ProjectType.Group;

    public ProjectStatus Status { get; set; } = ProjectStatus.Open;
}
