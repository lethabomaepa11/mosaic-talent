using System.Collections.Generic;

namespace MosaicTalent.Services.CompanyJobService.DTO
{
    public class AiVisualizationChartDto
    {
        public string Id { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string OptionJson { get; set; } = "{}";
    }

    public class GenerateReportVisualizationWithAiDto
    {
        public string Title { get; set; } = string.Empty;

        public string Summary { get; set; } = string.Empty;

        public List<AiVisualizationChartDto> Charts { get; set; } = new List<AiVisualizationChartDto>();
    }
}
