using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Gamification;

public class DeveloperEngagementBadge : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid DeveloperId { get; set; }

    [Required]
    [MaxLength(64)]
    public string BadgeCode { get; set; }

    [Required]
    [MaxLength(128)]
    public string Name { get; set; }

    [MaxLength(512)]
    public string Description { get; set; }

    public DateTime EarnedAt { get; set; }
}
