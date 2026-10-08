using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;

namespace MosaicTalent.Domains.Simulations;

public class SimulationSession : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }
    public Guid ScenarioId { get; set; }
    public SessionType SessionType { get; set; }
    public bool OrchestratorNeeded { get; set; }
}
