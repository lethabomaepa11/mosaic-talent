using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class CreateGithubRepositoryInput
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; }

    [MaxLength(400)]
    public string Description { get; set; }

    public bool IsPrivate { get; set; }
}
