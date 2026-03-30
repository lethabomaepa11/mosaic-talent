using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Companies;

public class Job : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid CompanyId { get; set; }

    [Required]
    [MaxLength(160)]
    public string Title { get; set; }

    [Required]
    [MaxLength(5000)]
    public string Description { get; set; }

    [Required]
    [MaxLength(240)]
    public string Location { get; set; }

    public EmploymentType EmploymentType { get; set; }

    public bool IsOpen { get; set; } = true;

    public int? ContractDuration { get; set; }

    [MaxLength(5000)]
    public string TechnicalAssessmentPrompt { get; set; }

    [MaxLength(5000)]
    public string BehaviouralAssessmentPrompt { get; set; }
}
