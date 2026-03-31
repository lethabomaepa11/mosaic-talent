using System.Collections.Generic;

namespace MosaicTalent.Services.DeveloperOnboardingService.DTO;

public class DeveloperSearchResultDto
{
    public string UserName { get; set; }
    public string DisplayName { get; set; }
    public string AvatarUrl { get; set; }
    public string GithubUsername { get; set; }
    public IEnumerable<string> SkillTags { get; set; } = new List<string>();
    public int? YearsOfExperience { get; set; }
}
