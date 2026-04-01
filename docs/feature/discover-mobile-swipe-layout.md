# Discover Mobile Swipe Layout

## Summary

Improved the Discover (`/app/projects/open`) mobile experience with a swipe-first card layout inspired by Tinder-style interaction hierarchy.

## What Changed

- Reworked swipe board sizing and spacing for mobile-first presentation:
  - `frontend/src/app/app/(developer)/projects/open/style.ts`
- Switched swipe cards to a dedicated visual variant with full-height card structure:
  - `frontend/src/components/project-card/ProjectCard.tsx`
  - `frontend/src/components/project-card/styles.ts`
- Removed extra action clutter inside swipe cards by hiding card-level join/view buttons in swipe mode and keeping a focused bottom action row.
- Updated swipe action controls to compact circular buttons for skip/join in swipe mode:
  - `frontend/src/app/app/(developer)/projects/open/page.tsx`
- Removed repository scanning from the Discover page to keep swipe browsing fast and focused:
  - `frontend/src/app/app/(developer)/projects/open/page.tsx`
- Updated swipe card visual to use a solid (non-transparent) background:
  - `frontend/src/components/project-card/styles.ts`
- Removed explicit Skip/Join buttons so Discover interaction is swipe-only:
  - right swipe = join
  - left swipe = skip
- Added Tinder-style `LIKE`/`NOPE` drag overlays on the top swipe card:
  - `frontend/src/app/app/(developer)/projects/open/page.tsx`
  - `frontend/src/app/app/(developer)/projects/open/style.ts`

## UX Outcome

- Cleaner mobile card flow with one dominant card.
- Better button hierarchy and less visual noise.
- Improved readability and touch behavior on narrow screens.
