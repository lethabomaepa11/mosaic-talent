# Teamwork Rating System-Managed

## Problem

Developers could manually set and edit teamwork rating during onboarding and profile editing, which allowed self-assigned ratings not aligned with actual collaboration performance.

## Solution

Teamwork rating is now system-managed and no longer user-editable.

- Frontend removed editable teamwork controls from onboarding and profile.
- Backend ignores user-provided teamwork rating values in profile upserts.
- Teamwork rating is recalculated from:
  - peer review ratings received
  - AI simulation assessor dimension scores

## Backend Changes

- Added `ITeamworkRatingService` + `TeamworkRatingService`.
- Added `TeamworkRatingCalculator` for deterministic weighted scoring.
- Updated `DeveloperOnboardingAppService`:
  - `UpsertMyProfile` no longer writes input teamwork rating.
  - teamwork rating is recalculated before returning profile data.
- Updated `PeerReviewAppService`:
  - recalculates reviewee teamwork rating after `SetPeerReviewRating`.
- Updated `SimulationScenarioAppService`:
  - recalculates teamwork rating after scored simulation turns.
- Updated simulation helper logic to avoid scoring non-user kickoff/progression system turns.

## Frontend Changes

- Onboarding:
  - removed teamwork slider.
  - added system-rating notice.
- Profile:
  - removed editable teamwork slider.
  - added read-only teamwork info in developer details.

## Testing

- Added backend tests:
  - `TeamworkRatingCalculator_Tests`
  - `DeveloperOnboardingAppService_Tests` (verifies user-provided teamwork rating is ignored)
