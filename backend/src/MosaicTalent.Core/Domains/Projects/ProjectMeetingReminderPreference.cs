using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Projects;

public class ProjectMeetingReminderPreference : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid MeetingId { get; set; }

    public Guid DeveloperId { get; set; }

    [Range(5, 240)]
    public int MinutesBefore { get; set; } = 15;

    public DateTime? LastTriggeredAtUtc { get; set; }

    public bool IsEnabled { get; set; } = true;
}
