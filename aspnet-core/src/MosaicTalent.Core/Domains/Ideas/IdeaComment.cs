using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Ideas;

public class IdeaComment : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }
    public Guid IdeaPostId { get; set; }
    public Guid AuthorDeveloperId { get; set; }

    [Required, MaxLength(2000)]
    public string Body { get; set; }
}
