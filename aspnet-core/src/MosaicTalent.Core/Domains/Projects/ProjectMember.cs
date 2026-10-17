using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;

namespace MosaicTalent.Domains.Projects;

public class ProjectMember : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid ProjectId { get; set; }

    public Guid DeveloperId { get; set; }

    public MemberRole Role { get; set; }

    public bool IsMentor { get; set; }
}
