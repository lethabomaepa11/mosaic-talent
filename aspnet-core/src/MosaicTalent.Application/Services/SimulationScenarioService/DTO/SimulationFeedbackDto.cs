using System.Collections.Generic;

namespace MosaicTalent.Services.SimulationScenarioService.DTO;

public class SimulationFeedbackDto
{
    public double CommunicationScore { get; set; }
    public double EmpathyScore { get; set; }
    public double ResolutionScore { get; set; }
    public double OverallScore { get; set; }
    public string Summary { get; set; }
    public List<string> Strengths { get; set; } = new();
    public List<string> Improvements { get; set; } = new();
    public List<string> Tips { get; set; } = new();
    public bool GeneratedByAi { get; set; }
}
