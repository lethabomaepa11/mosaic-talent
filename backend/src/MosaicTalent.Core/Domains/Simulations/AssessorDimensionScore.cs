using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Simulations;

public class AssessorDimensionScore : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }
    public Guid ObservationId { get; set; }
    public Dimension Dimension { get; set; }

    [Range(0, 100)]
    public double Score { get; set; }
}
