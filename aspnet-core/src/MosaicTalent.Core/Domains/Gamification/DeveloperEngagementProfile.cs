using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Gamification;

public class DeveloperEngagementProfile : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid DeveloperId { get; set; }

    [Range(0, int.MaxValue)]
    public int TotalPoints { get; set; }

    [Range(1, int.MaxValue)]
    public int Level { get; set; } = 1;

    public DateTime? LastRewardedAt { get; set; }
}
