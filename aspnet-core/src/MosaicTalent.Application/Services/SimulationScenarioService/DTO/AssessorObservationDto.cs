using System.Collections.Generic;

namespace MosaicTalent.Services.SimulationScenarioService.DTO;

public class AssessorObservationDto
{
    public int TurnIndex { get; set; }
    public string ObservationText { get; set; }
    public List<DimensionScoreDto> DimensionScores { get; set; } = new();
}

public class DimensionScoreDto
{
    public string Dimension { get; set; }
    public double Score { get; set; }
}
