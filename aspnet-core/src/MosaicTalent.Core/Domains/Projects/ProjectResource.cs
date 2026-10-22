using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Projects;

public class ProjectResource : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }
    public Guid ProjectId { get; set; }
    public Guid AddedByDeveloperId { get; set; }

    [Required, MaxLength(160)]
    public string Name { get; set; }

    [MaxLength(1200)]
    public string Description { get; set; }

    [Required, MaxLength(2048), Url]
    public string Url { get; set; }
}
