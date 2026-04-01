# Project Collaboration Tabs, Meetings, and Markdown Specs

## Summary

This feature upgrades project collaboration in four areas:

- Project details now use tabs instead of one long page:
  - `Repo Safety + Team`
  - `Project Spec`
  - `Repo Analysis`
  - `Tasks`
  - `Meetings (Jitsi)`
- Project creation moved from modal to full page (`/app/projects/create`).
- Project description now supports realtime markdown editing and rendering using `@uiw/react-md-editor`.
- Team collaboration adds meeting requests/scheduling/reminders plus workload warning checks before joining projects.

## Frontend Changes

### Create Project Page

File: `frontend/src/app/app/(developer)/projects/create/page.tsx`

- New full create page with:
  - dedicated `Create With AI` section placed before the manual form
  - GitHub repository selection + inline repo creation
  - explicit "Reconnect GitHub Access" action when repository permissions need to be refreshed
  - automatic repo safety scan enforcement
  - "Use README as Description" option for selected repo
  - AI spec generation (`title`, markdown description, skills, difficulty, estimated weekly hours)
  - `Generate Project` action in the AI section updates title + markdown + skills in one pass
  - markdown field has a `Use AI` action to generate/polish markdown only
  - skills field has a `Use AI` action to generate/polish skills only
  - realtime markdown editor + preview (`@uiw/react-md-editor`)
  - markdown editor now respects app light/dark theme for readable text contrast

### Follow-up Quality Fixes

- `CreateGithubRepository` now returns clearer permission guidance when GitHub rejects creation due missing/insufficient repository access.
- AI project idea generation now enforces a structured markdown spec output with concrete sections:
  - project metadata
  - overview/problem statement
  - goals/non-goals
  - requirements
  - technical approach
  - milestones
  - risks
  - acceptance criteria
  - definition of done
- AI effort estimation now avoids generic defaults by applying heuristic guards for `difficulty` and `estimatedHoursPerWeek` when model output is overly generic.

### Project Detail Tabs

File: `frontend/src/app/app/(developer)/projects/[id]/page.tsx`

- Added tabbed layout:
  - Team and repo safety in first tab
  - markdown project spec in second tab
  - repo analysis in third tab
  - tasks in fourth tab
  - Jitsi meetings in fifth tab
- Added workload warning flow on join with explicit continue confirmation.
- Added AI task generation action in tasks tab.
- Added task assignee support in UI.
- Added meetings UI:
  - request meeting
  - lead scheduling/cancel
  - per-member reminder preferences (minutes before + enable/disable)
  - join link via `https://meet.jit.si/<room>`

### Navigation

- `My Projects` now routes project creation to `/app/projects/create`.

## Backend Changes

### Project Domain Extensions

- Added project workload metadata:
  - `Difficulty`
  - `EstimatedHoursPerWeek`
- Added repo safety tracking fields for unsafe change notifications.
- Added task assignee field on `ProjectTask`.

### Meetings Domain

New entities:

- `ProjectMeeting`
- `ProjectMeetingReminderPreference`
- `ProjectMeetingStatus`

### New Project Service Endpoints

- `GetRepositoryReadme`
- `AiGenerateProjectSpec`
- `GetJoinProjectLoadWarning`
- `AiGenerateProjectTasks`
- `GetProjectMeetings`
- `RequestProjectMeeting`
- `ScheduleProjectMeeting`
- `SetProjectMeetingReminder`
- `CancelProjectMeeting`

### Existing Endpoint Changes

- `JoinProject` now supports `confirmHighWorkload`.
- `CreateProject` accepts difficulty and estimated weekly hours.
- `AddProjectTask` accepts optional assigned member.
- `ScanRepoSafety` now persists latest scan metadata and sends member warnings when newly unsafe.

## Validation

- Backend build: `dotnet build MosaicTalent.sln` passed.
- Frontend unit tests: `npm test` passed.
- Frontend production build: `npm run build` passed.
- E2E tests were intentionally skipped per instruction.

## Migration Note

Entity/model changes are included in this implementation. Database migration creation/execution in your environment should be handled manually as part of your deployment flow.
