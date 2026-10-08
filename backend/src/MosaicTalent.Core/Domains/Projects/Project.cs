using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Projects;

public class Project : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid OwnerDeveloperId { get; set; }

    [Required]
    [MaxLength(160)]
    public string Title { get; set; }

    [Required]
    [MaxLength(8000)]
    public string Description { get; set; }

    public ProjectStatus Status { get; set; }

    [Range(2, 8)]
    public int? MaxMembers { get; set; }

    public ProjectDifficulty Difficulty { get; set; } = ProjectDifficulty.Intermediate;

    [Range(1, 40)]
    public int EstimatedHoursPerWeek { get; set; } = 6;

    [MaxLength(256)]
    public string GithubRepo { get; set; }

    public DateTime? LastRepoSafetyScanAtUtc { get; set; }

    [MaxLength(40)]
    public string LastRepoSafetyRiskLevel { get; set; }

    [MaxLength(80)]
    public string LastRepoSafetyCommitSha { get; set; }

    [MaxLength(80)]
    public string LastUnsafeAlertCommitSha { get; set; }

    public ProjectType Type { get; set; }
}
