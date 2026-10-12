# Open project discovery decisions

Issue #91 improves the swipe view built alongside the searchable project list in #97. Discover now explains the skill-growth and teamwork purpose up front. The swipe deck shows progress through open projects and offers visible **Pass for now** and **Join this team** buttons, so touch gestures are optional. Dragging left or right remains available.

When a developer reaches the end, they can review the deck again or return to the full project browser. Joining still checks the existing workload warning and requires explicit confirmation where needed. A failed join leaves the current card in place; a successful join refreshes the open-project list, which excludes projects the developer has joined.

The UI calls the existing project provider actions. This change adds no endpoint or database migration. Browser validation covers decisions, failed joins, and the 360px swipe layout.
