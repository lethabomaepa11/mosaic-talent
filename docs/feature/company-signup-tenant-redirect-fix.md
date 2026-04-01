# Company Signup Tenant Redirect Fix

## Summary

After company signup in production, successful account creation redirected users to
`<tenant>.co.za/login` instead of `<tenant>.mosaictalent.co.za/login`.

## Root Cause

The company signup page built redirect URLs by replacing the hostname segment at index
`parts.length - 3`. For a root domain like `mosaictalent.co.za`, this replaced
`mosaictalent` directly with the tenant and produced `<tenant>.co.za`.

## Implementation

- Extracted redirect URL logic into `frontend/src/app/company/signup/buildCompanyLoginUrl.ts`.
- Added explicit root-domain handling:
  - If host is `mosaictalent.co.za` or any `*.mosaictalent.co.za`, redirect to
    `<tenant>.mosaictalent.co.za/login`.
- Preserved existing behaviors for:
  - `localhost` / `*.localhost` -> `<tenant>.localhost[:port]/login`
  - `mosaic-talent.vercel.app` -> `<tenant>-mosaic-talent.vercel.app/login`
- Kept generic fallback for non-root-domain environments.

## Test Coverage

Added `frontend/src/app/company/signup/__tests__/buildCompanyLoginUrl.test.ts` with coverage for:

- Root production domain redirect.
- Existing production tenant replacement.
- Localhost redirect with port.
- Vercel redirect format.
- Custom multi-level TLD root domain (`example.co.za`).

## Behavior Change

On production hosts using `mosaictalent.co.za`, post-signup redirect now always targets:

- `https://<tenancyName>.mosaictalent.co.za/login`
