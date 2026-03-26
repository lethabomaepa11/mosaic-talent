using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Simulations;

public class ScenarioMessage : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }
    public Guid SessionId { get; set; }
    public ScenarioRole Role { get; set; }

    [Required]
    [MaxLength(4000)]
    public string Content { get; set; }
}
