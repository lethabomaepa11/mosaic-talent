using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Projects;

public class ProjectProgressReview : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid EntryId { get; set; }

    public Guid ReviewerDeveloperId { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Comment { get; set; }
}
