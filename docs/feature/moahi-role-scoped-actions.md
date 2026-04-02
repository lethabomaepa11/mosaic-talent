# Ask Moahi Role-Scoped Actions

## Problem

Ask Moahi could explain or plan actions that are not available to the logged-in user role.

Example: developer users could ask how to create jobs and receive company-only guidance.

## Solution

Ask Moahi planning is now role-aware.

- Planner payload only includes routes/actions allowed for the active user role.
- If fallback parsing or model planning returns a restricted action, the assistant responds with a role-safe message and does not provide steps or execution offers.
- Empty-state examples in Ask Moahi are now role-specific (developer vs company).

## Implementation

- Added action-level role metadata in:
  - `frontend/src/lib/app-operator/actionRegistry.ts`
- Added role-aware filtering and restriction handling in:
  - `frontend/src/lib/app-operator/planner.ts`
- Updated types for role-aware planning inputs:
  - `frontend/src/lib/app-operator/types.ts`
  - `frontend/src/providers/app-operator-provider/context.tsx`
  - `frontend/src/providers/app-operator-provider/index.tsx`
- Updated Ask Moahi UI examples and role forwarding:
  - `frontend/src/components/app-operator/AppOperatorPanel.tsx`

## Testing

- Updated and added tests:
  - `frontend/src/lib/app-operator/__tests__/planner.test.ts`
  - `frontend/src/components/app-operator/__tests__/AppOperatorPanel.test.tsx`
- Verification commands:
  - `npm run test -- src/lib/app-operator/__tests__/planner.test.ts src/components/app-operator/__tests__/AppOperatorPanel.test.tsx`
  - `npx eslint ...` (changed files)
  - `npx tsc --noEmit`
