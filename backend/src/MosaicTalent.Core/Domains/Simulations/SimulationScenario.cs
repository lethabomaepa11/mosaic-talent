using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Simulations;

public class SimulationScenario : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    [Required]
    [MaxLength(160)]
    public string Title { get; set; }

    [Required]
    [MaxLength(3000)]
    public string Prompt { get; set; }

    [Range(1, 8)]
    public int BotCount { get; set; }
}
