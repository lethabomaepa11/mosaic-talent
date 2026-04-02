# Company Job Social Share + Copy Link

## Summary

Added job-level sharing actions in company jobs management.

## Behavior

- Each job card now has:
  - `Copy Public Link`
  - `Share` dropdown (LinkedIn, X, Facebook, WhatsApp)
- Public link is tenant-aware and resolves to the company jobs page:
  - Production example: `https://<company>.mosaictalent.co.za/jobs`

## Implementation Details

- Added tenant-aware jobs URL builder utility:
  - `buildTenantJobsUrl(...)`
- Added social share URL builder utility:
  - `buildSocialShareUrl(...)`
- Wired actions into company jobs page card actions.

## Files

- `frontend/src/app/app/(company)/jobs/page.tsx`
- `frontend/src/utils/jobShare.ts`
- `frontend/src/utils/__tests__/jobShare.test.ts`
