using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Ideas;

public class IdeaPost : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }
    public Guid CreatorDeveloperId { get; set; }

    [Required, MaxLength(160)]
    public string Title { get; set; }

    [Required, MaxLength(4000)]
    public string ProblemStatement { get; set; }

    [Required, MaxLength(4000)]
    public string ProposedSolution { get; set; }

    public bool IsArchived { get; set; }
    public bool IsPublic { get; set; } = true;
    public Guid? ConvertedProjectId { get; set; }
}
