using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Gamification;

public class DeveloperEngagementEvent : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid DeveloperId { get; set; }

    [Required]
    [MaxLength(64)]
    public string EventType { get; set; }

    [Required]
    [MaxLength(160)]
    public string EventKey { get; set; }

    [Range(0, int.MaxValue)]
    public int PointsAwarded { get; set; }

    [MaxLength(2000)]
    public string MetadataJson { get; set; }

    public DateTime OccurredAt { get; set; }
}
