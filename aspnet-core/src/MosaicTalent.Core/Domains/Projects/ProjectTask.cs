using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Projects;

public class ProjectTask : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid ProjectId { get; set; }

    [Required]
    [MaxLength(180)]
    public string Title { get; set; }

    [MaxLength(2000)]
    public string Description { get; set; }

    public Guid? AssignedDeveloperId { get; set; }

    public ProjectTaskStatus Status { get; set; }
}
