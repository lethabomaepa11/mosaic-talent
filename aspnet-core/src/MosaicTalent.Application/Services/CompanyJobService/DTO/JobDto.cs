using System;
using System.Collections.Generic;

namespace MosaicTalent.Services.CompanyJobService.DTO;

public class JobDto
{
    public Guid Id { get; set; }

    public Guid CompanyId { get; set; }

    public string CompanyName { get; set; }

    public string CompanyLogoStoredFileId { get; set; }

    public string Title { get; set; }

    public string Description { get; set; }

    public string Location { get; set; }

    public string EmploymentType { get; set; }

    public bool IsOpen { get; set; }

    public int? ContractDuration { get; set; }

    public string TechnicalAssessmentPrompt { get; set; }

    public string BehaviouralAssessmentPrompt { get; set; }

    public DateTime CreatedAt { get; set; }

    public int ApplicationCount { get; set; }

    public List<JobApplicationDto> Applications { get; set; } = new List<JobApplicationDto>();
}
