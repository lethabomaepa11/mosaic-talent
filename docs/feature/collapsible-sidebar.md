# Collapsible sidebar

Issue #92 adds a desktop collapse control to both developer and company sidebars. The expanded sidebar is 260px wide; the icon-only state is 76px wide, leaving more room for workspace content. Navigation links retain accessible names, titles, and the active-page marker while collapsed. The control is keyboard accessible.

The collapsed state lives in the app layout for the current navigation session. On screens below 992px, the existing drawer opens in its full-width navigation mode; the desktop sidebar remains hidden. No auth or data flow changes are involved.

Validation covers the collapsed developer navigation and control, frontend tests/build, and desktop/mobile viewport checks.
