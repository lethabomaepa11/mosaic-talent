using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Projects;

public class Project : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid OwnerDeveloperId { get; set; }

    [Required]
    [MaxLength(160)]
    public string Title { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; }

    public ProjectStatus Status { get; set; }

    [Range(2, 8)]
    public int? MaxMembers { get; set; }

    [MaxLength(256)]
    public string GithubRepo { get; set; }

    public ProjectType Type { get; set; }
}
