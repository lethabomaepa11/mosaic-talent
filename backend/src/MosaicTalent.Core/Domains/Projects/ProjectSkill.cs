using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Projects;

public class ProjectSkill : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid ProjectId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; }
}
