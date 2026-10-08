using System.Collections.Generic;

namespace MosaicTalent.Services.DeveloperOnboardingService.DTO;

public class DeveloperLearningPathResultDto
{
    public string Source { get; set; } = "fallback";
    public string Summary { get; set; } = string.Empty;
    public List<string> MarketSignals { get; set; } = new();
    public List<DeveloperLearningPathRecommendationDto> Recommendations { get; set; } = new();
}

public class DeveloperLearningPathRecommendationDto
{
    public string Goal { get; set; } = string.Empty;
    public string Priority { get; set; } = "medium";
    public int EstimatedWeeks { get; set; } = 6;
    public string GapSummary { get; set; } = string.Empty;
    public List<string> RecommendedSkills { get; set; } = new();
    public List<string> SuggestedActions { get; set; } = new();
}
