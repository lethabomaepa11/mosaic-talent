# Task Reassignment And Task Notifications

## Summary

Project members can now reassign tasks directly in project details, and task-related notifications were added for better team awareness.

## Behavior Changes

- New task reassignment endpoint:
  - `POST /api/services/app/DeveloperProject/ReassignProjectTask`
- Task assignee can be changed to another project member or cleared (unassigned).
- Notification is sent to the newly assigned member when:
  - a task is created with an assignee
  - a task is reassigned to them
  - AI-generated tasks assign them
- When a task status changes to `done`, all project members receive a completion notification.

## Frontend UX

- Task cards now include an assignee picker in the `Tasks` tab.
- Members can update assignee inline without opening a separate modal.
- Existing drag-and-drop/status controls remain unchanged.

## Implementation Notes

- Backend contract:
  - `aspnet-core/src/MosaicTalent.Application/Services/DeveloperProjectService/DTO/ReassignProjectTaskInput.cs`
  - `aspnet-core/src/MosaicTalent.Application/Services/DeveloperProjectService/IDeveloperProjectAppService.cs`
- Backend behavior:
  - `aspnet-core/src/MosaicTalent.Application/Services/DeveloperProjectService/DeveloperProjectAppService.cs`
  - `aspnet-core/src/MosaicTalent.Application/Services/DeveloperProjectService/DeveloperProjectAppService.Collaboration.cs`
- Frontend provider + UI:
  - `frontend/src/providers/project-provider/context.tsx`
  - `frontend/src/providers/project-provider/index.tsx`
  - `frontend/src/app/app/(developer)/projects/[id]/page.tsx`
  - `frontend/src/app/app/(developer)/projects/[id]/style.ts`
- Tests:
  - `frontend/src/providers/project-provider/__tests__/ProjectProvider.test.tsx`
