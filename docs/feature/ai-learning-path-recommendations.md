# AI Learning Path Recommendations

## Problem

Developers can list skills and goals, but they do not get concrete guidance on which skills to develop next for career progression against market demand.

## Solution

Added an on-demand AI learning path endpoint that maps a developer profile to role-based market requirements and returns actionable, personalized recommendations.

## Backend

- Added `GET /api/services/app/DeveloperOnboarding/GetMyLearningPathRecommendations`.
- Added DTOs:
  - `DeveloperLearningPathResultDto`
  - `DeveloperLearningPathRecommendationDto`
- Implemented AI generation in `DeveloperOnboardingAppService` using `IGroqChatService`.
- Added resilient fallback logic:
  - Uses role tracks (full-stack, backend, frontend, devops, ai).
  - Computes missing skills from current profile.
  - Produces actionable steps even when AI is unavailable or malformed.
- No database schema/model changes were introduced.

## Frontend

- Extended `developer-provider` state and actions with `learningPath` data and loading state.
- Profile page now fetches learning path recommendations on load for developer tenants.
- Added a new `AI Learning Path` card in `/app/profile`:
  - Summary
  - Market signals
  - Prioritized recommendations
  - Suggested actions
  - Loading state while recommendations are fetched

## Testing

- Updated provider unit tests:
  - `frontend/src/providers/developer-provider/__tests__/actions.test.ts`
  - `frontend/src/providers/developer-provider/__tests__/reducer.test.ts`
- Added Playwright test:
  - `frontend/e2e/profile-learning-path.spec.ts`
