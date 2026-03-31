# Assessment Connected Workspace UI

## Summary

Updated `/assessment/[id]` to use a connected workspace layout where the editor, preview/API panel, file explorer, and Copilot feel like one surface separated by border lines only.

## What changed

- Reworked workspace shell to remove card-stacked spacing and use a shared container/background.
- Added collapsible panel behavior:
  - File explorer can be opened/closed from the editor header.
  - Copilot rail can be opened/closed from the workspace toolbar.
- Updated Copilot composer:
  - `Enter` submits message.
  - `Shift+Enter` inserts newline.
  - Removed `Ask AI` text action and replaced it with a send icon button.
- Tightened spacing and separators:
  - Reduced unnecessary padding/gaps.
  - Replaced thick divider visuals with thin border separators.
- Improved work area usability:
  - Editor remains primary and resizable.
  - Preview/API pane remains resizable and usable with collapsed side panes.

## Editor visibility fix

- Added deterministic height rules for the workspace shell and panel group.
- Set an explicit clamp-based editor host height so Monaco cannot collapse to near-zero height.
- Reduced terminal minimum height to avoid crowding the editor area.
- Added layout guards (`height: 100%`, `min-width: 0`, `position: relative`) in key panel containers.

## HTML preview support

- Added live preview support for `.html` and `.htm` files in the assessment workspace.
- HTML files now render in an iframe `srcDoc` preview while JS/TS/React files continue using Sandpack.

## Files updated

- `frontend/src/app/assessment/[id]/page.tsx`
- `frontend/src/app/assessment/[id]/WorkbenchPanel.tsx`
- `frontend/src/app/assessment/[id]/AiPanel.tsx`
- `frontend/src/app/assessment/[id]/style.ts`
