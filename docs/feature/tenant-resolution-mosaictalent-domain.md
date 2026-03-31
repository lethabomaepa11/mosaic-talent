# Tenant Resolution for `mosaictalent.co.za`

## Summary

Tenant resolution now explicitly supports production domains in the form:

- `<tenant>.mosaictalent.co.za`

The tenant name is derived from the subdomain.

## Behavior

- `mosaictalent.co.za` -> no tenant (default/host context)
- `acme.mosaictalent.co.za` -> tenant `acme`
- `edge.acme.mosaictalent.co.za` -> tenant `acme` (label closest to root domain)

## Implementation

- Added host parsing utility:
  - `frontend/src/providers/tenant-provider/hostTenancy.ts`
- Updated tenant provider to use the parser:
  - `frontend/src/providers/tenant-provider/index.tsx`

The parser keeps existing support for:

- `*.localhost`
- `*-mosaic-talent.vercel.app`
- generic subdomain fallback

## Configuration

Optional environment override:

- `NEXT_PUBLIC_TENANT_ROOT_DOMAIN`

Default is:

- `mosaictalent.co.za`

## Test Coverage

Added unit tests:

- `frontend/src/providers/tenant-provider/__tests__/hostTenancy.test.ts`

Coverage includes:

- root-domain no-tenant behavior
- production subdomain tenant extraction
- nested subdomain extraction near root
- localhost and vercel compatibility
