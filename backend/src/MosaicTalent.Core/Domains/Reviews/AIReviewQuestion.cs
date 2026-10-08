using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Reviews;

public class AIReviewQuestion : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid PeerReviewId { get; set; }

    [Required]
    [MaxLength(500)]
    public string Text { get; set; }

    [MaxLength(80)]
    public string Type { get; set; }

    [MaxLength(200)]
    public string RelatedGoal { get; set; }

    [MaxLength(80)]
    public string Category { get; set; }
}

