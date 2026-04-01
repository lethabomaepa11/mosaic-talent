# Project Leave + Lead Role Assignment

## Summary

This feature adds two project-team controls:

- Members can leave a project with a required reason.
- Leads can assign/update member roles (`lead` / `member`) from project details.

When a member leaves, leads receive a notification with:

- the member's leave reason
- AI-generated lead guidance (with fallback guidance when AI is unavailable)

## Backend Changes

### New DeveloperProject endpoints

- `POST /api/services/app/DeveloperProject/LeaveProject`
- `PUT /api/services/app/DeveloperProject/AssignMemberRole`

### New DTOs

- `aspnet-core/src/MosaicTalent.Application/Services/DeveloperProjectService/DTO/LeaveProjectInput.cs`
- `aspnet-core/src/MosaicTalent.Application/Services/DeveloperProjectService/DTO/AssignProjectMemberRoleInput.cs`

### Leave flow behavior

- Leave reason is required.
- Members cannot leave if they are the only remaining member (prevents orphan projects with no team).
- If the owner leaves and another member exists:
  - ownership moves to a remaining lead if present, otherwise first remaining member is promoted to lead and set as owner.
- Lead notification event: `MosaicTalent.ProjectMemberLeft`
- Notification includes AI/fallback lead feedback to help with follow-up actions.

### Role assignment behavior

- Only leads can assign member roles.
- Owner cannot be demoted from lead.
- Project must always keep at least one lead.
- Role change notification event: `MosaicTalent.ProjectRoleUpdated`

## Frontend Changes

### Project provider actions

- Added:
  - `leaveProject(projectId, reason)`
  - `assignMemberRole(projectId, memberId, role)`

### Project detail page

File: `frontend/src/app/app/(developer)/projects/[id]/page.tsx`

- Added **Leave Project** action with modal requiring a reason.
- Added lead-only role selector beside each member in team list.
- Role updates and leave flow use provider actions (no direct component API calls).

## Validation

- Frontend provider tests updated for:
  - leave project action
  - assign role action
- Reducer/action tests updated for leave pending state
- Existing lint warnings remain baseline-only.

