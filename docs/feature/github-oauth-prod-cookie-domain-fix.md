# GitHub OAuth Production Cookie Domain Fix

## Summary

GitHub OAuth login worked on localhost but failed on production because OAuth-issued
session cookies were scoped to the backend domain, while the frontend runs on a different domain.

## Root Cause

- `TokenAuthController.GitHubCallback` wrote `mosaic-talent.access-token` on the backend host.
- Frontend app auth state depends on a frontend-domain cookie.
- Production and localhost were both brittle because session recovery depended on cross-origin cookie behavior.
- On localhost specifically, ports are ignored for cookies (`localhost:44311` and `localhost:3000` share `localhost`), so backend `HttpOnly` cookie with the same name blocked frontend JS cookie writes.

## Fix Implemented

- Backend OAuth callback now returns successful login redirects with token bootstrap data in URL fragment:
  - `#oauthAccessToken=<jwt>&oauthTenantId=<tenant|host>`
- Backend OAuth callback now stores backend-only cookies under separate names to avoid frontend collision:
  - `mosaic-talent.server-access-token`
  - `mosaic-talent.server-abp-tenant-id`
- Legacy frontend cookie names are explicitly deleted in callback before setting backend-only cookies:
  - `mosaic-talent.access-token`
  - `mosaic-talent.abp-tenant-id`
- Frontend `AuthProvider` consumes that fragment on load, writes frontend-domain auth/tenant cookies, and clears the hash.
- Frontend auth restore now marks bootstrapping as pending during startup, so `/app` guard does not redirect to `/login` before restore completes.
- Cross-origin fallback remains in place:
  - `fetchAccessTokenFromApi()` still uses `axios.get(..., { withCredentials: true })`
- Backend OAuth session cookies use cross-site-compatible options when HTTPS is used:
  - `SameSite=None`
  - `Secure=true`
  - `HttpOnly=true`
- Backend client redirect URL now trims trailing `/` before appending `/app` to avoid accidental `//app` redirects that can drop OAuth hash on normalization redirects.

## Why This Works

- OAuth callback no longer relies on browser cross-site cookie exchange to establish initial frontend session.
- Frontend always gets a deterministic token handoff immediately after callback and persists it on the app domain.
- Cookie-based API fallback still covers recovery paths.

## Localhost Compatibility

- Localhost callback now follows the same deterministic fragment bootstrap flow as production.
- Cookie mode still falls back to `SameSite=Lax` when request is not HTTPS.

## Additional Team Rule Bundled

Per team request, workflow rules were updated to include this React convention:

- If a function is called inside a `useEffect`, do not include that function in that effect dependency array.
