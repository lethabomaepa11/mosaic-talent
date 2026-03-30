# Gamification: Badges, Points, and Levels

## Problem

User participation in peer reviews and growth activities can decline over time without clear rewards.

## Solution

Implemented a gamification layer that awards points, progression levels, and badges for meaningful collaboration and development actions.

## What Was Added

### Backend domain models

- `DeveloperEngagementProfile`
- `DeveloperEngagementBadge`
- `DeveloperEngagementEvent`

These persist progression, earned badges, and an idempotent reward ledger.

### Gamification engine service

- Added `IDeveloperGamificationService` and `DeveloperGamificationService`.
- Provides:
  - `AwardAsync(...)` for action-based rewards
  - `GetSummaryAsync(...)` for profile summary
- Uses unique event keys to prevent duplicate/farmed rewards.

### Reward hooks

Points are now awarded on:

- Peer review rating submission (`peer_review_rating`)
- Peer review completion (`peer_review_completed`)
- Receiving a completed peer review (`peer_review_received`)
- Project completion as lead/member (`project_completed_lead` / `project_completed_member`)
- Simulation evaluation completion (`simulation_evaluated`)

### API

- Added `GET /api/services/app/DeveloperOnboarding/GetMyGamificationSummary`

### Frontend

- Extended `developer-provider` with gamification summary state/actions.
- Profile page now shows a new **Progress & Badges** card:
  - level
  - total points
  - level progress bar
  - unlocked badges
- Reviews page now surfaces reward feedback after rating/answer actions when points are awarded.

## Badge Rules

Initial badge rules include:

- First Contribution
- Review Collaborator
- Trusted Teammate
- Project Finisher
- Simulation Learner
- Level Five

## Testing

- Updated developer-provider unit tests for gamification actions/reducer state.
- Extended Playwright profile test to validate gamification + learning-path rendering.

## Migration Note

Database schema changed with new gamification entities.
Run migrations manually after pulling this feature branch.
