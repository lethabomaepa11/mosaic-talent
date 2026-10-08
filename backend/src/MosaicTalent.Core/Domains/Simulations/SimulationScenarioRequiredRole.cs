using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;

namespace MosaicTalent.Domains.Simulations;

public class SimulationScenarioRequiredRole : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }
    public Guid ScenarioId { get; set; }
    public BotRole Role { get; set; }
}
