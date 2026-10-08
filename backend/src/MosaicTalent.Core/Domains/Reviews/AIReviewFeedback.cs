using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Reviews;

public class AIReviewFeedback : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid ProjectId { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Summary { get; set; }

    [Required]
    [MaxLength(6000)]
    public string StrengthsJson { get; set; }

    [Required]
    [MaxLength(6000)]
    public string ImprovementAreasJson { get; set; }

    [Required]
    [MaxLength(6000)]
    public string TipsJson { get; set; }

    [Range(0, 100)]
    public int GrowthScore { get; set; }
}

