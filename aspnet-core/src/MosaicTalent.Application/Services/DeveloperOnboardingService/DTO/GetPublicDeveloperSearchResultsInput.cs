namespace MosaicTalent.Services.DeveloperOnboardingService.DTO;

public class GetPublicDeveloperSearchResultsInput
{
    public string Query { get; set; }
    public int MaxResults { get; set; } = 6;
}
