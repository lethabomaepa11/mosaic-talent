# Restrict Landing On Subdomain

## Summary

Blocked the public landing page (`/`) for tenant subdomain contexts.

## Behavior

- On default/root domain, landing page remains accessible.
- On tenant subdomains (including Vercel tenant hostnames), users are redirected from `/` to `/app`.
- While tenant resolution is still loading, a loader is shown instead of rendering landing content.

## Files

- `frontend/src/app/(landing)/page.tsx`
- `frontend/src/app/(landing)/style.ts`
- `frontend/src/app/(landing)/landingAccess.ts`
- `frontend/src/app/(landing)/__tests__/landingAccess.test.ts`
