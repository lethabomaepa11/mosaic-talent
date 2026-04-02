# Project Detail Loading + 404 Fallback

## Summary

Fixed a UX bug in project detail where a valid project briefly showed **"Project not found"** before the project fetch completed.

## What Changed

- Added explicit project detail view-state resolution (`loading`, `ready`, `not-found`).
- Project detail now shows a loader while project fetch is still in progress.
- When fetch completes without a valid project, the page renders the existing custom animated 404 page (`app/not-found.tsx`) instead of inline text.

## Files

- `frontend/src/app/app/(developer)/projects/[id]/page.tsx`
- `frontend/src/app/app/(developer)/projects/[id]/projectLoadState.ts`
- `frontend/src/app/app/(developer)/projects/[id]/__tests__/projectLoadState.test.ts`

## Notes

- This removes the false-negative not-found flash during initial load and route transitions between project detail pages.
