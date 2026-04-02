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

## Why

The previous combined tab was dense and harder to use, especially on smaller screens. Splitting concerns improves clarity and task focus.
