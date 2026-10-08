using MosaicTalent.Domains.Developers;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.DeveloperOnboardingService.DTO;

public class UpsertDeveloperOnboardingInput
{
    [Required]
    [MaxLength(64)]
    public string GithubUsername { get; set; }

    [MaxLength(512)]
    public string AvatarUrl { get; set; }

    [Range(0, 80)]
    public int? YearsOfExperience { get; set; }

    [Range(0, 9)]
    public int? YearOfStudy { get; set; }

    public StudyLevel StudyLevel { get; set; }

    [MaxLength(2000)]
    public string Bio { get; set; }

    [MaxLength(256)]
    public string Location { get; set; }

    [Range(0, 10)]
    public double TeamworkRating { get; set; }

    public List<string> Skills { get; set; } = new();
    public List<string> Goals { get; set; } = new();
}
