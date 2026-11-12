# Desktop sidebar stays visible while the page scrolls

The owner reported that desktop navigation scrolled out of view on long pages. This is a layout fix on the existing `feature/developer-build-together` branch, following the approved practical UI direction.

## Cause and change

The sidebar and its wrapper already used `position: sticky; top: 0`. Global `overflow-x: hidden` on `html` and `body` made the body's computed vertical overflow `auto`, creating an ancestor scroll container. The document scrolled while that ancestor did not, so the sidebar moved with the page instead of staying against the viewport.

Replace the global horizontal overflow rule with `overflow-x: clip`. This still clips horizontal overflow without creating that scroll container. The existing sidebar width, collapse control, navigation, and page layout remain in place. No fixed-position offsets or duplicated sidebar widths are introduced. Mobile navigation remains at the bottom of the viewport.

Before the fix, a 900px page scroll moved the sidebar top from 0 to -900px. The browser probe with the corrected overflow rule kept it at 0 while the document scrolled to 1,000px.

## Validation

`frontend/e2e/desktop-sidebar-scroll.spec.ts` uses a long project list to verify that:

- Page content actually moves while the desktop sidebar remains at top 0.
- Expanded and collapsed sidebars retain their 240px and 76px widths.
- Navigation and Sign Out remain visible at 800px and 600px desktop heights.
- The sidebar stays in place near the bottom of the document as well as midway down it.
- At 768px and 360px, desktop navigation is hidden, mobile navigation remains visible, and there is no horizontal page overflow.

This revision changes CSS only in the application. It adds no endpoint, authentication change, dependency, or database migration. The existing usability issue draft tracks the follow-up because GitHub authentication is unavailable. Local preview and validation results are recorded before handoff; no production deployment is included.

The regression failed against the previous build with a sidebar top of -900px. It passes against the corrected build, including collapse/expand, shorter desktop height, bottom-of-page scrolling, and tablet/phone navigation. The assertion allows less than one CSS pixel for browser subpixel rounding. The full browser suite passed 33 checks together with the branding follow-up; a final five-check sidebar/branding/landing recheck also passed.
