using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Simulations;

public class OrchestratorLog : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }
    public Guid SessionId { get; set; }
    public int TurnIndex { get; set; }
    public BotRole NextBotRole { get; set; }
    public bool CoherenceCheckPassed { get; set; }

    [MaxLength(1000)]
    public string CoherenceNotes { get; set; }

    public DateTime Timestamp { get; set; }
}
