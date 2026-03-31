# Route Groups + Workspace Guards

## Summary

The authenticated app routes are now partitioned using Next.js route groups:

- `frontend/src/app/app/(company)` for company-only pages.
- `frontend/src/app/app/(developer)` for developer-only pages.

Shared pages such as `/app/profile` remain outside these groups.

## Why

Previously, access checks were spread across individual pages, which allowed inconsistent behavior and duplicated guard logic.

The route-group guard approach enforces access at layout level so:

- developers cannot access company route segments
- company users cannot access developer route segments

## What changed

### 1) Route grouping

Moved folders:

- `app/jobs`, `app/reports`, `app/settings` -> `app/(company)/...`
- `app/projects`, `app/reviews`, `app/simulator` -> `app/(developer)/...`

URL paths are unchanged because route-group names are not included in public paths.

### 2) Guard layouts

Added:

- `frontend/src/app/app/(company)/layout.tsx`
- `frontend/src/app/app/(developer)/layout.tsx`

Both use a shared guard component:

- `frontend/src/components/guards/WorkspaceRouteGuard.tsx`

Redirect behavior:

- non-company user entering company routes -> `/app/projects/open`
- company user entering developer routes -> `/app`

### 3) Tests

Added coverage for allow/deny behavior:

- `frontend/src/components/guards/__tests__/WorkspaceRouteGuard.test.tsx`

## Notes

- Shared routes remain in `frontend/src/app/app` (for example `/app/profile`).
- Existing page-level checks can remain as defense-in-depth, but primary access control is now centralized at group layout level.
