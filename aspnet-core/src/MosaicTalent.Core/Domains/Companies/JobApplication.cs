using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Companies;

public class JobApplication : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid JobId { get; set; }

    public Guid CandidateDeveloperId { get; set; }

    [MaxLength(2048)]
    public string ResumeStoredFileId { get; set; }

    [Range(0, 100)]
    public double MatchScore { get; set; }

    [MaxLength(2000)]
    public string MatchReason { get; set; }

    public ApplicationSource Source { get; set; }

    public ApplicationStatus Status { get; set; } = ApplicationStatus.Applied;
}
