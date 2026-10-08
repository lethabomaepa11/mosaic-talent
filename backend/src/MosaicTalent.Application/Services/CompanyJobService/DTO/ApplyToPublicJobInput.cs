using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.CompanyJobService.DTO;

public class ApplyToPublicJobInput
{
    public Guid JobId { get; set; }

    [Required]
    [MaxLength(160)]
    public string FullName { get; set; }

    [Required]
    [MaxLength(320)]
    [EmailAddress]
    public string Email { get; set; }

    [MaxLength(40)]
    public string PhoneNumber { get; set; }

    [MaxLength(2048)]
    public string ResumeStoredFileId { get; set; }

    [MaxLength(5000)]
    public string TechnicalAssessmentAnswer { get; set; }

    [MaxLength(5000)]
    public string BehaviouralAssessmentAnswer { get; set; }

    [MaxLength(12000)]
    public string ResponsesJson { get; set; }

    public int Source { get; set; } = 5;
}
