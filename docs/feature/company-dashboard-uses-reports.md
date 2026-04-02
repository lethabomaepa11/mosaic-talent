# Company Dashboard Uses Reports

## Problem

Company users had two overlapping destinations:

- `/app` dashboard with placeholder KPIs
- `/app/reports` with full analytics

This split the experience and duplicated navigation.

## Solution

The reports analytics view now powers the company dashboard directly at `/app`.

- Company dashboard route now renders the full analytics workspace.
- Standalone reports navigation item is removed from the company sidebar.
- Ask Moahi route registry no longer exposes a separate reports route.
- Legacy `/app/reports` route now redirects to `/app`.

## Files Updated

- `frontend/src/app/app/page.tsx`
- `frontend/src/app/app/(company)/reports/page.tsx`
- `frontend/src/components/company/reports-dashboard/CompanyReportsDashboard.tsx`
- `frontend/src/components/company/reports-dashboard/style.ts`
- `frontend/src/components/company/reports-dashboard/index.ts`
- `frontend/src/components/company/sidebar.tsx`
- `frontend/src/lib/app-operator/routeRegistry.ts`
- `frontend/src/lib/app-operator/planner.ts`

## Behavior Changes

- Company users land on analytics when opening `/app`.
- `/app/reports` redirects to `/app`.
- Sidebar no longer shows a separate Reports entry.
- Requests for reports/analytics through Moahi resolve to dashboard.
