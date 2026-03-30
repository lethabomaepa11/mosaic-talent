using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.CompanyJobService.DTO;

public class GenerateJobsPageWithAiInput
{
    [MaxLength(2000)]
    public string Prompt { get; set; }
}
