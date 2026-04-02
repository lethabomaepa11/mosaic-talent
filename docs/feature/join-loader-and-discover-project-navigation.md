# Join Loader And Discover Project Navigation

## Summary

Improved join experience and discover navigation for open projects.

## Behavior Changes

- While joining a project, users now see a blocking loader modal with:
  - `Joining project`
- This join loader now applies in:
  - open projects swipe flow
  - project detail join action
- During this join request, browser unload attempts are guarded with a `beforeunload` prompt.
- Swipe cards in open projects now include a `View Project` action so users can open project details directly.

## Implementation Notes

- Open projects join UX:
  - `frontend/src/app/app/(developer)/projects/open/page.tsx`
  - `frontend/src/app/app/(developer)/projects/open/style.ts`
- Project detail join UX:
  - `frontend/src/app/app/(developer)/projects/[id]/page.tsx`
  - `frontend/src/app/app/(developer)/projects/[id]/style.ts`
- Project card compact actions:
  - `frontend/src/components/project-card/ProjectCard.tsx`
- Added component coverage:
  - `frontend/src/components/project-card/__tests__/ProjectCard.test.tsx`
