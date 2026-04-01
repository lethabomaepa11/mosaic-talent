using Abp.Notifications;
using Abp.UI;
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
    public async Task<List<ProjectMeetingDto>> GetProjectMeetings(GetDeveloperProjectInput input)
    {
        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        var meetings = await _projectMeetingRepository.GetAll()
            .Where(x => x.ProjectId == project.Id)
            .OrderBy(x => x.StartsAtUtc)
            .ToListAsync();

        await EnsureReminderPreferenceRows(project.Id, meetings.Select(x => x.Id).ToList());
        await DispatchDueMeetingReminders(project, meetings);
        return await MapMeetings(project.Id, meetings, developer.Id);
    }

    public async Task<ProjectMeetingDto> RequestProjectMeeting(RequestProjectMeetingInput input)
    {
        var developer = await GetCurrentDeveloper();
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        ValidateMeetingWindow(input.StartsAtUtc, input.EndsAtUtc);

        var meeting = new ProjectMeeting
        {
            TenantId = tenantId,
            ProjectId = project.Id,
            RequestedByDeveloperId = developer.Id,
            Title = input.Title.Trim(),
            Agenda = (input.Agenda ?? string.Empty).Trim(),
            StartsAtUtc = input.StartsAtUtc,
            EndsAtUtc = input.EndsAtUtc,
            Status = ProjectMeetingStatus.Requested,
        };

        await _projectMeetingRepository.InsertAsync(meeting);
        await CurrentUnitOfWork.SaveChangesAsync();
        await EnsureReminderPreferenceRows(project.Id, new List<Guid> { meeting.Id });

        try
        {
            var leadUserIds = await ResolveProjectLeadUserIds(project.Id, developer.UserId);
            if (leadUserIds.Count > 0)
            {
                var message = $"Meeting request \"{meeting.Title}\" was submitted for \"{project.Title}\".";
                await _notificationEventDispatcher.NotifyUsersAsync(
                    project.TenantId,
                    leadUserIds,
                    "MosaicTalent.ProjectMeetingRequested",
                    message,
                    NotificationSeverity.Info,
                    $"/app/projects/{project.Id}",
                    "Meeting request",
                    message);
            }
        }
        catch (Exception ex)
        {
            Logger.Warn("Failed to notify leads about meeting request.", ex);
        }

        var mapped = await MapMeetings(project.Id, new List<ProjectMeeting> { meeting }, developer.Id);
        return mapped.First();
    }

    public async Task<ProjectMeetingDto> ScheduleProjectMeeting(ScheduleProjectMeetingInput input)
    {
        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        await EnsureCanManageMeetings(project, developer.Id);
        ValidateMeetingWindow(input.StartsAtUtc, input.EndsAtUtc);

        var meeting = await _projectMeetingRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == input.MeetingId && x.ProjectId == project.Id)
            ?? throw new UserFriendlyException("Meeting not found.");

        meeting.Title = input.Title.Trim();
        meeting.Agenda = (input.Agenda ?? string.Empty).Trim();
        meeting.StartsAtUtc = input.StartsAtUtc;
        meeting.EndsAtUtc = input.EndsAtUtc;
        meeting.Status = ProjectMeetingStatus.Scheduled;
        meeting.ScheduledByDeveloperId = developer.Id;
        meeting.JitsiRoomName = string.IsNullOrWhiteSpace(input.JitsiRoomName)
            ? BuildDefaultJitsiRoomName(project.Title, meeting.Id)
            : input.JitsiRoomName.Trim();

        await _projectMeetingRepository.UpdateAsync(meeting);
        await CurrentUnitOfWork.SaveChangesAsync();
        await EnsureReminderPreferenceRows(project.Id, new List<Guid> { meeting.Id });

        try
        {
            var memberUserIds = await ResolveProjectMemberUserIds(project.Id);
            if (memberUserIds.Count > 0)
            {
                var message = $"Meeting \"{meeting.Title}\" has been scheduled. Join from the meetings tab.";
                await _notificationEventDispatcher.NotifyUsersAsync(
                    project.TenantId,
                    memberUserIds,
                    "MosaicTalent.ProjectMeetingScheduled",
                    message,
                    NotificationSeverity.Info,
                    $"/app/projects/{project.Id}",
                    "Meeting scheduled",
                    message);
            }
        }
        catch (Exception ex)
        {
            Logger.Warn("Failed to notify members about meeting schedule.", ex);
        }

        var mapped = await MapMeetings(project.Id, new List<ProjectMeeting> { meeting }, developer.Id);
        return mapped.First();
    }

    public async Task<ProjectMeetingDto> SetProjectMeetingReminder(SetProjectMeetingReminderInput input)
    {
        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        var meeting = await _projectMeetingRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == input.MeetingId && x.ProjectId == project.Id)
            ?? throw new UserFriendlyException("Meeting not found.");

        var preference = await _projectMeetingReminderPreferenceRepository.GetAll()
            .FirstOrDefaultAsync(x => x.MeetingId == meeting.Id && x.DeveloperId == developer.Id);
        if (preference == null)
        {
            preference = new ProjectMeetingReminderPreference
            {
                TenantId = project.TenantId,
                MeetingId = meeting.Id,
                DeveloperId = developer.Id,
                MinutesBefore = Math.Clamp(input.MinutesBefore, 5, 240),
                IsEnabled = input.Enabled,
            };
            await _projectMeetingReminderPreferenceRepository.InsertAsync(preference);
        }
        else
        {
            preference.MinutesBefore = Math.Clamp(input.MinutesBefore, 5, 240);
            preference.IsEnabled = input.Enabled;
            preference.LastTriggeredAtUtc = null;
            await _projectMeetingReminderPreferenceRepository.UpdateAsync(preference);
        }

        await CurrentUnitOfWork.SaveChangesAsync();
        var mapped = await MapMeetings(project.Id, new List<ProjectMeeting> { meeting }, developer.Id);
        return mapped.First();
    }

    public async Task<ProjectMeetingDto> CancelProjectMeeting(CancelProjectMeetingInput input)
    {
        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        await EnsureCanManageMeetings(project, developer.Id);

        var meeting = await _projectMeetingRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == input.MeetingId && x.ProjectId == project.Id)
            ?? throw new UserFriendlyException("Meeting not found.");
        meeting.Status = ProjectMeetingStatus.Cancelled;
        await _projectMeetingRepository.UpdateAsync(meeting);
        await CurrentUnitOfWork.SaveChangesAsync();

        var mapped = await MapMeetings(project.Id, new List<ProjectMeeting> { meeting }, developer.Id);
        return mapped.First();
    }

    private static void ValidateMeetingWindow(DateTime startsAtUtc, DateTime endsAtUtc)
    {
        if (startsAtUtc == default || endsAtUtc == default || endsAtUtc <= startsAtUtc)
        {
            throw new UserFriendlyException("Meeting start and end times are invalid.");
        }
    }

    private async Task EnsureCanManageMeetings(Project project, Guid actorDeveloperId)
    {
        var membership = await _projectMemberRepository.GetAll()
            .FirstOrDefaultAsync(x => x.ProjectId == project.Id && x.DeveloperId == actorDeveloperId)
            ?? throw new UserFriendlyException("Project membership not found.");
        if (project.OwnerDeveloperId != actorDeveloperId && membership.Role != MemberRole.Lead)
        {
            throw new UserFriendlyException("Only project leads can schedule or cancel meetings.");
        }
    }

    private async Task EnsureReminderPreferenceRows(Guid projectId, List<Guid> meetingIds)
    {
        if (meetingIds.Count == 0)
        {
            return;
        }

        var members = await _projectMemberRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .Select(x => new { x.TenantId, x.DeveloperId })
            .Distinct()
            .ToListAsync();
        if (members.Count == 0)
        {
            return;
        }

        var existing = await _projectMeetingReminderPreferenceRepository.GetAll()
            .Where(x => meetingIds.Contains(x.MeetingId))
            .ToListAsync();
        var existingSet = existing
            .Select(x => $"{x.MeetingId:N}:{x.DeveloperId:N}")
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var meetingId in meetingIds)
        {
            foreach (var member in members)
            {
                var key = $"{meetingId:N}:{member.DeveloperId:N}";
                if (existingSet.Contains(key))
                {
                    continue;
                }

                await _projectMeetingReminderPreferenceRepository.InsertAsync(new ProjectMeetingReminderPreference
                {
                    TenantId = member.TenantId,
                    MeetingId = meetingId,
                    DeveloperId = member.DeveloperId,
                    MinutesBefore = 15,
                    IsEnabled = true,
                });
            }
        }

        await CurrentUnitOfWork.SaveChangesAsync();
    }

    private async Task DispatchDueMeetingReminders(Project project, List<ProjectMeeting> meetings)
    {
        var nowUtc = DateTime.UtcNow;
        var upcoming = meetings
            .Where(x => x.Status == ProjectMeetingStatus.Scheduled &&
                        x.StartsAtUtc > nowUtc &&
                        x.StartsAtUtc <= nowUtc.AddHours(4))
            .ToList();
        if (upcoming.Count == 0)
        {
            return;
        }

        var meetingIds = upcoming.Select(x => x.Id).ToList();
        var reminders = await _projectMeetingReminderPreferenceRepository.GetAll()
            .Where(x => meetingIds.Contains(x.MeetingId) && x.IsEnabled)
            .ToListAsync();
        if (reminders.Count == 0)
        {
            return;
        }

        var developers = await _developerRepository.GetAll()
            .Where(x => reminders.Select(r => r.DeveloperId).Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.UserId);
        var meetingMap = upcoming.ToDictionary(x => x.Id, x => x);
        var changed = false;

        foreach (var reminder in reminders)
        {
            if (!meetingMap.TryGetValue(reminder.MeetingId, out var meeting))
            {
                continue;
            }

            var triggerAt = meeting.StartsAtUtc.AddMinutes(-Math.Clamp(reminder.MinutesBefore, 5, 240));
            var isTriggered = reminder.LastTriggeredAtUtc.HasValue &&
                              reminder.LastTriggeredAtUtc.Value >= triggerAt;
            if (isTriggered || nowUtc < triggerAt || nowUtc >= meeting.StartsAtUtc)
            {
                continue;
            }

            if (!developers.TryGetValue(reminder.DeveloperId, out var userId) || userId <= 0)
            {
                continue;
            }

            var message = $"Meeting \"{meeting.Title}\" starts in {reminder.MinutesBefore} minutes.";
            await _notificationEventDispatcher.NotifyUsersAsync(
                project.TenantId,
                new[] { userId },
                "MosaicTalent.ProjectMeetingReminder",
                message,
                NotificationSeverity.Info,
                $"/app/projects/{project.Id}",
                "Meeting reminder",
                message);

            reminder.LastTriggeredAtUtc = nowUtc;
            await _projectMeetingReminderPreferenceRepository.UpdateAsync(reminder);
            changed = true;
        }

        if (changed)
        {
            await CurrentUnitOfWork.SaveChangesAsync();
        }
    }

    private static string BuildDefaultJitsiRoomName(string projectTitle, Guid meetingId)
    {
        var baseName = new string((projectTitle ?? "project")
            .ToLowerInvariant()
            .Select(ch => char.IsLetterOrDigit(ch) ? ch : '-')
            .ToArray());
        while (baseName.Contains("--", StringComparison.Ordinal))
        {
            baseName = baseName.Replace("--", "-", StringComparison.Ordinal);
        }

        baseName = baseName.Trim('-');
        if (string.IsNullOrWhiteSpace(baseName))
        {
            baseName = "project";
        }

        return $"mosaic-{baseName}-{meetingId.ToString("N")[..8]}";
    }
}
