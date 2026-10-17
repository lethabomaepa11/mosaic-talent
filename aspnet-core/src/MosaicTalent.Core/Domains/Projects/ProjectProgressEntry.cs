using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Projects;

public class ProjectProgressEntry : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid ProjectId { get; set; }

    public Guid DeveloperId { get; set; }

    [Required]
    [MaxLength(160)]
    public string Title { get; set; }

    [Required]
    [MaxLength(3000)]
    public string Summary { get; set; }

    [Required]
    [MaxLength(2048)]
    public string EvidenceUrl { get; set; }

    [Required]
    [MaxLength(2000)]
    public string SelfReview { get; set; }
}
