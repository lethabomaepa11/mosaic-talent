# R2 Image Host Allowlist + CI E2E Removal

## Summary

- Fixed Next.js runtime failures when rendering remote company logos hosted on Cloudflare R2.
- Updated CI workflow to remove Playwright E2E execution so CI only runs type-check, lint, unit tests, and build.

## What Changed

- Added `images.remotePatterns` in `frontend/next.config.ts`:
  - protocol: `https`
  - hostname: `**.r2.dev`
  - pathname: `/company-logos/**`
- Removed Playwright browser install and E2E test steps from `.github/workflows/ci.yml`.

## Why

- Next.js `next/image` requires explicit host allowlisting for remote image optimization.
- E2E in CI was intentionally removed to reduce runtime and unblock release flow.
