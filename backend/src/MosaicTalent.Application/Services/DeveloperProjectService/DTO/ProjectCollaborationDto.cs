using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class ProjectJoinLoadWarningDto
{
    public bool ShouldWarn { get; set; }
    public int ActiveProjects { get; set; }
    public int RecommendedProjectLimit { get; set; }
    public int CurrentWorkloadScore { get; set; }
    public int ProposedWorkloadScore { get; set; }
    public int RecommendedWorkloadLimit { get; set; }
    public string Message { get; set; }
}

public class AiGenerateProjectSpecInput
{
    [MaxLength(400)]
    public string Prompt { get; set; }

    [MaxLength(140)]
    public string RepoNameHint { get; set; }
}

public class AiGeneratedProjectSpecDto
{
    public string Title { get; set; }
    public string DescriptionMarkdown { get; set; }
    public List<string> Skills { get; set; } = new();
    public string Difficulty { get; set; }
    public int EstimatedHoursPerWeek { get; set; }
}

public class RepositoryReadmeInput
{
    [Required]
    [MaxLength(256)]
    public string GithubRepo { get; set; }
}

public class RepositoryReadmeDto
{
    public string RepoKey { get; set; }
    public string Content { get; set; }
}

public class ProjectMeetingDto
{
    public string Id { get; set; }
    public string ProjectId { get; set; }
    public string Title { get; set; }
    public string Agenda { get; set; }
    public string Status { get; set; }
    public DateTime StartsAtUtc { get; set; }
    public DateTime EndsAtUtc { get; set; }
    public string JitsiRoomName { get; set; }
    public string RequestedByMemberId { get; set; }
    public string RequestedByMemberName { get; set; }
    public string ScheduledByMemberId { get; set; }
    public int ReminderMinutesBefore { get; set; }
    public bool ReminderEnabled { get; set; }
}

public class RequestProjectMeetingInput
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    [MaxLength(180)]
    public string Title { get; set; }

    [MaxLength(4000)]
    public string Agenda { get; set; }

    public DateTime StartsAtUtc { get; set; }

    public DateTime EndsAtUtc { get; set; }
}

public class ScheduleProjectMeetingInput
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    public Guid MeetingId { get; set; }

    [Required]
    [MaxLength(180)]
    public string Title { get; set; }

    [MaxLength(4000)]
    public string Agenda { get; set; }

    [MaxLength(120)]
    public string JitsiRoomName { get; set; }

    public DateTime StartsAtUtc { get; set; }

    public DateTime EndsAtUtc { get; set; }
}

public class SetProjectMeetingReminderInput
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    public Guid MeetingId { get; set; }

    [Range(5, 240)]
    public int MinutesBefore { get; set; } = 15;

    public bool Enabled { get; set; } = true;
}

public class CancelProjectMeetingInput
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    public Guid MeetingId { get; set; }
}

public class AiGenerateProjectTasksInput
{
    [Required]
    public Guid ProjectId { get; set; }

    [MaxLength(8000)]
    public string RepoAnalysisSummary { get; set; }
}
