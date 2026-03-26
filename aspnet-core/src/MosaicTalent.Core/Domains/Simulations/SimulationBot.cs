using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Simulations;

public class SimulationBot : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }
    public Guid SessionId { get; set; }
    public BotRole Role { get; set; }

    [Required]
    [MaxLength(3000)]
    public string PersonalityPrompt { get; set; }

    [MaxLength(4000)]
    public string CurrentState { get; set; }

    public bool IsActive { get; set; }
    public int? TurnOrder { get; set; }
}
