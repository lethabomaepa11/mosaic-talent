using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Reviews;

public class PeerReview : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid ProjectId { get; set; }

    public Guid ReviewerDeveloperId { get; set; }

    public Guid RevieweeDeveloperId { get; set; }

    [Range(1, 10)]
    public int Rating { get; set; } = 5;
}

