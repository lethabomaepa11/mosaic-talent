# Company Reports PDF/Excel Export

## Summary

Updated the company reports dashboard to remove non-functional header controls and provide working export actions.

## Changes

- Removed the `Filter` and `Last 6 months` buttons from reports header.
- Added `Export PDF` action.
- Added `Export Excel` action.
- PDF export now includes the company logo in the report header when available.
- Export now includes all computed report sections:
  - Overview KPIs
  - Hiring trends
  - Recruitment pipeline
  - Quality metrics
  - Role turnaround
  - Application sources

## Implementation Notes

- Excel export uses `xlsx` and writes a multi-sheet `.xlsx` file.
- PDF export uses `jspdf` + `jspdf-autotable` and includes all report tables in one document.
- Exports are generated from the already loaded dashboard data; no backend changes or new endpoints were needed.

## Files Updated

- `frontend/src/components/company/reports-dashboard/CompanyReportsDashboard.tsx`
- `frontend/package.json`
- `frontend/package-lock.json`
