# Project Detail Team Tab Split

## Summary

The project detail page now separates Team and Repo Safety into different tabs.

## What Changed

- Replaced combined `Repo Safety + Team` tab with:
  - `Repo Safety`
  - `Team`
- Kept existing team management actions in the `Team` tab:
  - role assignment
  - lead remove-member action
- moved `AI Fill Team` action into the `Team` tab only
- moved `Leave Project` action into the `Team` tab only
- Kept repository safety content and scan state in the `Repo Safety` tab.
- mobile tabs now use horizontal single-row scrolling so all tabs stay reachable without wrapping.
- mobile tabs now use compact labels to fit smaller screens (`Safety`, `Spec`, `Analysis`, etc.).
- tabs now use clear card-style visual treatment with icons to make sections more obvious for everyday users.
- `Complete Project` and `Delete Project` actions are now positioned above the project title for quicker access.

## Why

The previous combined tab was dense and harder to use, especially on smaller screens. Splitting concerns improves clarity and task focus.
