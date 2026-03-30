# Dark Mode Logo Asset Switching

## Summary

The shared text logo was hardcoded with a white wordmark (`#ffffff`), which became unreadable in light mode.

To make logo rendering theme-safe, the app now switches between two assets based on the appearance mode:

- Dark mode: `text-logo.svg` (white wordmark)
- Light mode: `text-logo-light.svg` (dark wordmark)

## Implementation Details

- Added `frontend/public/text-logo-light.svg` by cloning the original logo and changing only the wordmark fill color to `#111827`.
- Updated all frontend `text-logo.svg` usages to resolve source from `useAppearanceState().mode`:
  - `frontend/src/app/(landing)/page.tsx`
  - `frontend/src/app/login/page.tsx`
  - `frontend/src/components/app-sidebar/AppSidebar.tsx`
  - `frontend/src/components/company/sidebar.tsx`

## Why This Approach

- Keeps brand mark/icon unchanged.
- Avoids brittle CSS inversion/filter tricks that can distort brand colors.
- Applies consistently across landing, auth, and app shell surfaces.
