using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Projects;

public class ProjectMeeting : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid ProjectId { get; set; }

    public Guid RequestedByDeveloperId { get; set; }

    public Guid? ScheduledByDeveloperId { get; set; }

    [Required]
    [MaxLength(180)]
    public string Title { get; set; }

    [MaxLength(4000)]
    public string Agenda { get; set; }

    [MaxLength(120)]
    public string JitsiRoomName { get; set; }

    public DateTime StartsAtUtc { get; set; }

    public DateTime EndsAtUtc { get; set; }

    public ProjectMeetingStatus Status { get; set; } = ProjectMeetingStatus.Requested;
}
