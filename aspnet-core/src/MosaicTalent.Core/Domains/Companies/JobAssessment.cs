using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Companies;

public class JobAssessment : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid JobId { get; set; }

    public Guid? JobApplicationId { get; set; }

    public Guid? PublicJobApplicationId { get; set; }

    [MaxLength(160)]
    public string CandidateName { get; set; }

    [MaxLength(320)]
    public string CandidateEmail { get; set; }

    [MaxLength(5000)]
    public string Prompt { get; set; }

    [MaxLength(5000)]
    public string Instructions { get; set; }

    [MaxLength(12000)]
    public string ContextJson { get; set; }

    [MaxLength(20000)]
    public string SubmissionText { get; set; }

    [MaxLength(2048)]
    public string SubmissionGithubRepo { get; set; }

    [MaxLength(12000)]
    public string AssessmentResultJson { get; set; }

    [Range(0, 100)]
    public double Score { get; set; }

    [MaxLength(500)]
    public string Verdict { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public AssessmentStatus Status { get; set; } = AssessmentStatus.Pending;
}
