# Company Settings Admin Access

## Date

- March 28, 2026

## Summary

Company settings access is now role-aware:

- Admin-only:
  - Company Details
  - Build Pages
  - Employees
- Available to all company employees:
  - Email Templates

## Implementation

1. Role checks now use `CompanyProfileProvider` (`profile.role`).
2. Settings index hides admin-only cards for non-admin users.
3. Admin-only settings routes return guarded empty states for non-admin users.
4. Added new admin-only employees settings page:
   - list current employees
   - add new employee (name, surname, username, email, password, role)
   - wired to real provider actions:
     - `fetchMyCompanyEmployees`
     - `addCompanyEmployee`

## Notes

- Backend already enforces admin-only actions for employee management; frontend now matches that policy.
- Email Templates remains accessible for admin and HR users.
