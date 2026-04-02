# Company Email Template Types

## Summary

Expanded company email templates from a single template to a typed list of templates.

## Implemented Types

- Application Received
- Shortlisted
- Interview Invite

## What Changed

- Company settings email templates page now includes:
  - a list of email types
  - per-type enable/disable toggle
  - per-type generation mode (`manual` / `ai`)
  - per-type subject and body editor
- Template settings JSON now persists all supported types.
- Default template JSON (frontend + backend) now includes all three template types.

## Files

- `frontend/src/app/app/(company)/settings/email-templates/page.tsx`
- `frontend/src/app/app/(company)/settings/email-templates/style.ts`
- `frontend/src/app/app/(company)/settings/email-templates/emailTemplateSettings.ts`
- `frontend/src/app/app/(company)/settings/email-templates/__tests__/emailTemplateSettings.test.ts`
- `frontend/src/providers/job-provider/index.tsx`
- `aspnet-core/src/MosaicTalent.Application/Services/CompanyJobService/CompanyJobAppService.cs`
