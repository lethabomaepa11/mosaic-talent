using System.Collections.Generic;

namespace MosaicTalent.Services.DeveloperOnboardingService.DTO;

public class GetProfileFieldSuggestionsInput
{
    public string Field { get; set; }
    public string Query { get; set; }
    public List<string> ExistingValues { get; set; } = new();
    public int MaxResults { get; set; } = 8;
}
