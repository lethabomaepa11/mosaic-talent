using MosaicTalent.Domains.Developers;
using System.Collections.Generic;

namespace MosaicTalent.Services.DeveloperOnboardingService.DTO;

public class DeveloperOnboardingDto
{
    public string GithubUsername { get; set; }
    public string AvatarUrl { get; set; }
    public int? YearsOfExperience { get; set; }
    public int? YearOfStudy { get; set; }
    public StudyLevel StudyLevel { get; set; }
    public string Bio { get; set; }
    public string Location { get; set; }
    public double TeamworkRating { get; set; }
    public List<string> Skills { get; set; } = new();
    public List<string> Goals { get; set; } = new();
}
