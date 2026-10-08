using System.Collections.Generic;

namespace MosaicTalent.Services.DeveloperOnboardingService.DTO;

public class ProfileFieldSuggestionsDto
{
    public string Field { get; set; }
    public string Query { get; set; }
    public string Source { get; set; }
    public List<string> Suggestions { get; set; } = new();
}
