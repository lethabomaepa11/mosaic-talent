# Auth Route Group Guard

## Summary

Added an auth route group guard so authenticated users cannot access `/login` or `/signup`.

## What Changed

- Moved auth pages into an App Router route group:
  - `app/(auth)/login/page.tsx`
  - `app/(auth)/signup/page.tsx`
- Added `app/(auth)/layout.tsx` to wrap auth routes with a HOC.
- Introduced `WithAuth` HOC:
  - waits for tenant/auth bootstrap
  - redirects authenticated users to `/app`
  - renders auth pages only for unauthenticated users

## Files

- `frontend/src/app/(auth)/layout.tsx`
- `frontend/src/app/(auth)/login/page.tsx`
- `frontend/src/app/(auth)/signup/page.tsx`
- `frontend/src/hoc/WithAuth/WithAuth.tsx`
- `frontend/src/hoc/WithAuth/__tests__/WithAuth.test.tsx`

## Notes

- Route group naming does not change public URLs, so routes remain `/login` and `/signup`.
