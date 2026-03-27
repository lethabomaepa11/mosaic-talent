using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Companies;

public class PublicJobApplication : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid JobId { get; set; }

    public Guid? CandidateDeveloperId { get; set; }

    [MaxLength(160)]
    public string FullName { get; set; }

    [MaxLength(320)]
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
    public string ApplicationResponseJson { get; set; }

    public ApplicationSource Source { get; set; }

    [Range(0, 100)]
    public double MatchScore { get; set; }

    [MaxLength(2000)]
    public string MatchReason { get; set; }

    public ApplicationStatus Status { get; set; } = ApplicationStatus.Applied;
}
