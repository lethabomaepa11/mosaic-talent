using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Reviews;

public class ReviewAnswer : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid AIReviewQuestionId { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Text { get; set; }
}

