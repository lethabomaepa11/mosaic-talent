# Global Opening + Closing Transition

## Summary

Added a global transition layer that introduces:

- a strong opening animation after hard reload
- a best-effort closing animation trigger before page leave/reload
- a global top loading progress bar for route transitions using `@bprogress/next`

## Behavior

- On hard reload (`navigation.type === "reload"`), a full-screen branded opening transition plays once.
- On leave/reload events (`beforeunload` / `pagehide`), the transition layer is triggered for a fast closing effect.
- During route navigation, a top progress indicator displays loading state.

## Implementation

- Added `PageTransitionGate` component:
  - `frontend/src/components/page-transition/PageTransitionGate.tsx`
  - `frontend/src/components/page-transition/styles.ts`
- Integrated globally in app providers:
  - `frontend/src/components/providers/index.tsx`
- Added dependency:
  - `@bprogress/next`

## Notes

- Browser unload timing differs by platform; closing animation is best-effort.
- Opening animation on hard reload is deterministic and consistent.
