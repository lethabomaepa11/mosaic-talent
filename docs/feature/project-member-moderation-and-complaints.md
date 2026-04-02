# Project Member Moderation And Complaints

## Summary

Project collaboration now includes lead moderation and member complaint flows:

- Leads can remove members with a required reason.
- Members (non-leads) can log complaints to project leads.

## Backend Changes

- Added `RemoveProjectMember(RemoveProjectMemberInput)` in `DeveloperProjectAppService`.
  - Lead/owner authorization required.
  - Reason is required.
  - Owner cannot be removed.
  - Current actor cannot remove themselves (must use leave flow).
  - Project must still retain at least one lead.
  - Notifications are dispatched to the removed member and other leads.

- Added `SubmitProjectComplaint(SubmitProjectComplaintInput)` in `DeveloperProjectAppService`.
  - Only non-lead members can submit complaints.
  - Complaint text is required.
  - Complaint is routed to project lead notifications.

## Frontend Changes

- Added project provider actions:
  - `removeProjectMember(projectId, memberId, reason)`
  - `submitProjectComplaint(projectId, complaint)`

- In project detail page:
  - Team list now shows a lead-only `Remove` action per removable member.
  - `Remove Member` modal requires a reason.
  - Members see `Log Complaint` action and can submit concerns to leads via modal.

## API Endpoints

- `POST /api/services/app/DeveloperProject/RemoveProjectMember`
- `POST /api/services/app/DeveloperProject/SubmitProjectComplaint`
