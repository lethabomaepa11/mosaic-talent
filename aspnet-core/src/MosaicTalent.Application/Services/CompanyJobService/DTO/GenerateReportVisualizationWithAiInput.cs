using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.CompanyJobService.DTO
{
    public class GenerateReportVisualizationWithAiInput
    {
        [Required]
        [MaxLength(2000)]
        public string Prompt { get; set; }

        [Required]
        [MaxLength(30000)]
        public string ReportSnapshotJson { get; set; }
    }
}
