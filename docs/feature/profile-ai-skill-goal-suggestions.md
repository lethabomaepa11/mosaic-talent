# Profile AI Skill and Goal Suggestions

## Problem

Profile skill and goal suggestions were hardcoded. They did not adapt to each user profile, and typing into the fields did not provide AI-backed suggestions.

## Solution

Replaced hardcoded profile suggestions with AI-driven suggestions:

- clickable suggestion chips for both skills and goals
- live suggestions while typing in the skill/goal input

## Implementation Details

- Added backend endpoint:
  - `POST /api/services/app/DeveloperOnboarding/GetProfileFieldSuggestions`
- Added DTOs:
  - `GetProfileFieldSuggestionsInput`
  - `ProfileFieldSuggestionsDto`
- Added backend suggestion engine:
  - `ProfileFieldSuggestionEngine`
  - Handles AI response parsing, fallback generation, dedupe, query filtering, and existing-value filtering.
- Added frontend provider action:
  - `getProfileFieldSuggestions` in `developer-provider`
- Updated profile page:
  - removed hardcoded `AVAILABLE_SKILLS` and `LEARNING_GOALS`
  - removed `Use AI` buttons for skills/goals
  - added `AutoComplete` suggestion behavior for skill/goal typing
  - renders AI/fallback suggestion chips under each section
  - chips and autocomplete both add values to draft with duplicate protection
- Added frontend helper utilities:
  - `normalizeSuggestionValues`
  - `toSuggestionOptions`

## Testing

- Added unit tests:
  - `frontend/src/app/app/profile/__tests__/aiSuggestions.test.ts`
  - `aspnet-core/test/MosaicTalent.Tests/DeveloperOnboarding/ProfileFieldSuggestionEngine_Tests.cs`
- Covers:
  - suggestion normalization + dedupe + query filtering
  - fallback behavior constraints for skill/goal suggestions
  - AI suggestion JSON parsing behavior
