# AI Fill Team Invite Workflow

## Summary

AI Fill Team now sends project invites instead of directly adding members.

## Behavior Changes

- `AiFillTeam` creates pending invites for selected developers.
- Invited developers receive invite notifications:
  - in-app
  - email (when Brevo sender/api key are configured)
- Invited developers can accept or reject invites.
- Accepting invite adds the developer to project members.
- Rejecting invite marks the invite as rejected and notifies project lead(s).

## New API Endpoints

- `GET /api/services/app/DeveloperProject/GetProjectInvites`
- `POST /api/services/app/DeveloperProject/AcceptProjectInvite`
- `POST /api/services/app/DeveloperProject/RejectProjectInvite`

## Project Detail UX

- Team tab includes an `Invited` section for pending invites.
- Invited users can accept/reject from project detail.
- AI Fill Team button now indicates invite flow.

## Data Model

- New entity: `ProjectTeamInvite`
- New enum: `ProjectTeamInviteStatus` (`pending`, `accepted`, `rejected`)

## Migration Note

A new table/index set is required for `ProjectTeamInvite`.
Run database migrations manually in your environment (agent does not run migrations).
