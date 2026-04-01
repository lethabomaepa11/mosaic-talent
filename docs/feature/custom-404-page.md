# Custom 404 Page

## Summary

Added a branded animated 404 experience for unmatched routes and missing pages.

## What Changed

- Added `frontend/src/app/not-found.tsx` as the root App Router not-found UI.
- Added route-scoped styling in `frontend/src/app/not-found/style.ts` using `createStyles`.
- Implemented an animated 3D-like cube scene and floating shards for visual depth.
- Added clear recovery actions:
  - `Take Me Home` (routes to `/`)
  - `Go Back` (browser history back)
- Added tests in `frontend/src/app/__tests__/not-found.test.tsx`.

## Design Notes

- Message copy uses: **"Oops, looks like you are lost"**.
- Animation uses existing `framer-motion` plus CSS 3D transforms (no extra heavy 3D dependency).
- Layout is mobile-first and adapts for tablet and desktop.
