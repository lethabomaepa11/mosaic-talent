using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Projects;

public class ProjectTeamInvite : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid ProjectId { get; set; }

    public Guid DeveloperId { get; set; }

    public Guid InvitedByDeveloperId { get; set; }

    public ProjectTeamInviteStatus Status { get; set; } = ProjectTeamInviteStatus.Pending;

    public DateTime? RespondedAtUtc { get; set; }

    [MaxLength(600)]
    public string ResponseReason { get; set; }
}
