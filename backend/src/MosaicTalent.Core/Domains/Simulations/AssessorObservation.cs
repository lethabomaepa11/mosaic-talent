using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Simulations;

public class AssessorObservation : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }
    public Guid SessionId { get; set; }
    public int TurnIndex { get; set; }

    [Required]
    [MaxLength(3000)]
    public string ObservationText { get; set; }
}
