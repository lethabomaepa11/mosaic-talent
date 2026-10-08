using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.CompanyJobService.DTO;

public class UpdateJobInput
{
    public Guid JobId { get; set; }

    [Required]
    [MaxLength(160)]
    public string Title { get; set; }

    [Required]
    [MaxLength(5000)]
    public string Description { get; set; }

    [Required]
    [MaxLength(240)]
    public string Location { get; set; }

    public int EmploymentType { get; set; }

    public bool IsOpen { get; set; }

    public int? ContractDuration { get; set; }

    [MaxLength(5000)]
    public string TechnicalAssessmentPrompt { get; set; }

    [MaxLength(5000)]
    public string BehaviouralAssessmentPrompt { get; set; }
}
