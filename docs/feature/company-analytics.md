# Company Analytics Dashboard

## Date

- March 28, 2026

## Summary

Added a real company analytics dashboard at `/app/reports` for company workspaces.

## Data Source (Real)

Analytics are computed from live provider data:

- `fetchMyJobs()`
- `fetchJobApplications(jobId)` for each company job

No mock chart datasets are used.

## Metrics Implemented

1. KPI cards:
- total applications
- open positions
- average assessment turnaround (created to assessment submitted)
- offer acceptance rate (approved vs rejected outcomes)

2. Overview:
- 6-month hiring trend (applications, progressed candidates, hires)
- hiring momentum summary

3. Pipeline:
- stage distribution for applied, shortlisted, assessment, interview, hired, rejected

4. Quality:
- average match score
- average assessment score
- strong-verdict rate
- fastest assessment turnaround by role

5. Sources:
- source distribution by application source
- top channel insight

## UX / Responsiveness

- Implemented in route-colocated files:
  - `app/app/reports/page.tsx`
  - `app/app/reports/style.ts`
- Mobile-first responsive layout with breakpoint expansions for tablet/desktop.

## Notes

- Route is company-tenant only and redirects non-company workspace users to `/app`.
- Export/filter/date controls are UI placeholders for future server-side reporting workflows.
