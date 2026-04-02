# Project Delete Restricted To Sole Member

## Summary

Project deletion is now restricted so a project can only be deleted by the owner when they are the only remaining member.

## Behavior

- Added `DeleteProject` endpoint in `DeveloperProjectAppService`.
- Backend checks:
  - project exists
  - requester is a project member
  - requester is the project owner
  - project has exactly one member
  - owner membership is lead role
- If checks fail, a user-friendly validation error is returned.

## Frontend UX

- Added a `Delete Project` action in project details.
- Button is enabled only when the current user is owner and the member count is 1.
- If not eligible, helper text explains that other members must be removed first.
- On success, user is redirected back to `/app/projects`.
