using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Projects;

public class ProjectWikiPage : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }
    public Guid ProjectId { get; set; }
    public Guid CreatedByDeveloperId { get; set; }
    public Guid UpdatedByDeveloperId { get; set; }

    [Required, MaxLength(160)]
    public string Title { get; set; }

    [MaxLength(20000)]
    public string ContentMarkdown { get; set; }
}
