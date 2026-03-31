# Public Developer Profiles and Project Visibility

## Problem

Users could not view other developers' public profiles and project history without being inside private, authenticated flows.

## Solution

Implemented a public profile surface at `/developers/[username]` that is accessible without login and shows:

- Developer public profile details (name, avatar, bio, location, skills, GitHub handle)
- Current projects (active/in-progress/open/draft)
- Completed projects

Project team members in the project details page now link directly to each member's public profile when a username is available.

## Backend Changes

- Added anonymous endpoint:
  - `GET /api/services/app/DeveloperOnboarding/GetPublicProfile`
- New DTOs:
  - `GetPublicDeveloperProfileInput`
  - `DeveloperPublicProfileDto`
  - `DeveloperPublicProjectDto`
- `DeveloperProjectMemberDto` now includes `userName` so frontend can link member names to public profiles.

Public profile data sources:

- `Developer`, `User`, `DeveloperProfile`, `DeveloperProfileSkill`
- `ProjectMember`, `Project`, `ProjectSkill`

## Frontend Changes

- Added provider action:
  - `getPublicProfile(userName)` in `developer-provider`
- Added public page:
  - `frontend/src/app/developers/[username]/page.tsx`
  - `frontend/src/app/developers/[username]/style.ts`
- Updated project member rendering in project details:
  - member name links to `/developers/[username]` when available.

## Behavior Notes

- If a public profile is missing or username is invalid, UI shows a friendly unavailable state.
- If a profile has no current/completed projects, each section renders an empty state.
