# Remove Image URL Inputs Except Page Builder

## Summary

Removed manual image URL input fields from non-page-builder screens. Image handling now relies on upload flows while preserving previews and saved values.

## What Changed

- Onboarding:
  - removed manual avatar URL entry from `frontend/src/app/onboarding/page.tsx`
- Profile:
  - removed manual avatar URL entry from `frontend/src/app/app/profile/page.tsx`
- Company details:
  - removed manual logo URL entry from `frontend/src/app/app/(company)/settings/company-details/page.tsx`

## Scope Note

- Page Builder image URL support remains unchanged, as requested.
