using Microsoft.EntityFrameworkCore;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.DeveloperProjectService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperProjectService;

public partial class DeveloperProjectAppService
{
    private async Task<List<ProjectMeetingDto>> MapMeetings(
        Guid projectId,
        List<ProjectMeeting> meetings,
        Guid currentDeveloperId)
    {
        if (meetings.Count == 0)
        {
            return new List<ProjectMeetingDto>();
        }

        var memberIds = await _projectMemberRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .Select(x => x.DeveloperId)
            .Distinct()
            .ToListAsync();
        var memberNameMap = await BuildMemberNameMap(memberIds);
        var reminderRows = await _projectMeetingReminderPreferenceRepository.GetAll()
            .Where(x => meetings.Select(m => m.Id).Contains(x.MeetingId) && x.DeveloperId == currentDeveloperId)
            .ToListAsync();
        var reminderMap = reminderRows.ToDictionary(x => x.MeetingId, x => x);

        return meetings.Select(meeting =>
        {
            var hasReminder = reminderMap.TryGetValue(meeting.Id, out var reminder);
            return new ProjectMeetingDto
            {
                Id = meeting.Id.ToString(),
                ProjectId = meeting.ProjectId.ToString(),
                Title = meeting.Title,
                Agenda = meeting.Agenda,
                Status = ToMeetingStatusLabel(meeting.Status),
                StartsAtUtc = meeting.StartsAtUtc,
                EndsAtUtc = meeting.EndsAtUtc,
                JitsiRoomName = meeting.JitsiRoomName ?? string.Empty,
                RequestedByMemberId = meeting.RequestedByDeveloperId.ToString(),
                RequestedByMemberName = memberNameMap.TryGetValue(meeting.RequestedByDeveloperId, out var requestedName)
                    ? requestedName
                    : "Member",
                ScheduledByMemberId = meeting.ScheduledByDeveloperId?.ToString() ?? string.Empty,
                ReminderMinutesBefore = hasReminder ? reminder.MinutesBefore : 15,
                ReminderEnabled = hasReminder ? reminder.IsEnabled : true,
            };
        }).ToList();
    }

    private async Task<Dictionary<Guid, string>> BuildMemberNameMap(List<Guid> developerIds)
    {
        if (developerIds.Count == 0)
        {
            return new Dictionary<Guid, string>();
        }

        var developers = await _developerRepository.GetAll()
            .Where(x => developerIds.Contains(x.Id))
            .ToListAsync();
        var users = await _userRepository.GetAll()
            .Where(x => developers.Select(d => d.UserId).Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x);

        var map = new Dictionary<Guid, string>();
        foreach (var developer in developers)
        {
            users.TryGetValue(developer.UserId, out var user);
            var fullName = string.Join(" ", new[] { user?.Name, user?.Surname }
                .Where(x => !string.IsNullOrWhiteSpace(x)));
            map[developer.Id] = string.IsNullOrWhiteSpace(fullName)
                ? user?.UserName ?? "Member"
                : fullName;
        }

        return map;
    }

    private async Task<List<long>> ResolveProjectLeadUserIds(Guid projectId, long actorUserId)
    {
        var leadDeveloperIds = await _projectMemberRepository.GetAll()
            .Where(x => x.ProjectId == projectId && x.Role == MemberRole.Lead)
            .Select(x => x.DeveloperId)
            .Distinct()
            .ToListAsync();
        if (leadDeveloperIds.Count == 0)
        {
            return new List<long>();
        }

        return await _developerRepository.GetAll()
            .Where(x => leadDeveloperIds.Contains(x.Id) && x.UserId != actorUserId)
            .Select(x => x.UserId)
            .Distinct()
            .ToListAsync();
    }

    private static string ToMeetingStatusLabel(ProjectMeetingStatus status)
    {
        return status switch
        {
            ProjectMeetingStatus.Requested => "requested",
            ProjectMeetingStatus.Scheduled => "scheduled",
            ProjectMeetingStatus.Completed => "completed",
            ProjectMeetingStatus.Cancelled => "cancelled",
            _ => "requested",
        };
    }
}
