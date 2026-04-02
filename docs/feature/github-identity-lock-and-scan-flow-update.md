# GitHub Identity Lock And Scan Flow Update

## Problem

Developers could still type a GitHub username manually on onboarding/profile, and the profile page exposed a manual `Scan GitHub` action.

This allowed user-entered identity drift from OAuth-linked GitHub accounts and made the scan flow inconsistent.

## Solution

- GitHub username is now read-only on onboarding and profile.
- Manual `Scan GitHub` action was removed from profile UI.
- Profile save validation now instructs users to connect/sign in with GitHub when username is missing.
- Backend `UpsertMyProfile` keeps an existing `Developer.GithubUsername` locked and ignores manual change attempts.

## Frontend Changes

- `frontend/src/app/onboarding/page.tsx`
  - GitHub username input set to read-only/disabled.
  - Added helper text explaining GitHub username is synced from connected account.
- `frontend/src/app/onboarding/style.ts`
  - Added `fieldHint` style for the GitHub helper copy.
- `frontend/src/app/app/profile/page.tsx`
  - Removed manual GitHub scan button and result card.
  - Made GitHub username input read-only/disabled.
  - Updated validation message to require GitHub connection.

## Backend Changes

- `aspnet-core/src/MosaicTalent.Application/Services/DeveloperOnboardingService/DeveloperOnboardingAppService.cs`
  - Existing developer GitHub usernames are now treated as identity-linked and not overwritten by user input.

## Testing

- Added/updated onboarding service tests in:
  - `aspnet-core/test/MosaicTalent.Tests/DeveloperOnboarding/DeveloperOnboardingAppService_Tests.cs`
  - coverage includes manual GitHub username change protection.
