using System.Collections.Generic;

namespace MosaicTalent.Services.PeerReviewService.DTO;

public class AIReviewFeedbackDto
{
    public string Summary { get; set; }

    public List<string> Strengths { get; set; } = new List<string>();

    public List<string> ImprovementAreas { get; set; } = new List<string>();

    public List<string> Tips { get; set; } = new List<string>();

    public int GrowthScore { get; set; }
}

