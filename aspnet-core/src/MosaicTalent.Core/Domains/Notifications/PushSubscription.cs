using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Notifications;

public class PushSubscription : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public long UserId { get; set; }

    [Required]
    [MaxLength(2048)]
    public string Endpoint { get; set; }

    [Required]
    [MaxLength(512)]
    public string P256DH { get; set; }

    [Required]
    [MaxLength(512)]
    public string Auth { get; set; }

    [MaxLength(256)]
    public string DeviceName { get; set; }

    [MaxLength(512)]
    public string UserAgent { get; set; }

    public bool IsActive { get; set; }

    public DateTime LastSeenAt { get; set; }
}
