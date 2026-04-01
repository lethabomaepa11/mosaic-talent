# Mobile Tabs And Header Responsiveness

## Summary

Improved mobile responsiveness for project detail tabs and top headers with user avatar controls.

## What Changed

- Project detail tabs now support mobile horizontal navigation with better touch sizing:
  - `frontend/src/app/app/(developer)/projects/[id]/page.tsx`
  - `frontend/src/app/app/(developer)/projects/[id]/style.ts`
- Developer header actions now align more cleanly on mobile and avatar control has improved spacing/visual treatment:
  - `frontend/src/components/app-header/AppHeader.tsx`
  - `frontend/src/components/app-header/styles.ts`
- Company header action row and user-avatar button now render better on small screens (name hidden on mobile, avatar-first control):
  - `frontend/src/components/company/header.tsx`
  - `frontend/src/components/company/header.styles.ts`

## UX Outcome

- No crowded/ugly header avatar area on mobile.
- Project tabs are readable, tap-friendly, and less prone to overflow issues on narrow screens.
