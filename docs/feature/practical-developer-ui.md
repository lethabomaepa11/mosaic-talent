# Practical developer UI

Approved by the owner on 7 November 2026: replace the slogan-heavy Build together interface with a straightforward application for developers. This is the current UI direction on `feature/developer-build-together`; it preserves the earlier backend, migration, tenant, and authentication fixes.

## What was wrong

The first redesign spent the first phone screen on promotional headings, a preferences panel, and decorative project artwork. Returning users had to scroll to find their work. Repeated terms such as “next chapter”, “build brief”, and “useful deliverable” made ordinary actions harder to recognize. Passing functional tests did not establish that this hierarchy was useful.

## Current behavior

- **Landing:** explains that developers can find teammates and build a project together. Create account is visible in the first phone viewport. The page explains the actual workflow and cofounder trial purpose without decorative artwork or repeated promotional sections.
- **Home:** shows assigned unfinished tasks and the user’s active projects first. A developer without a project gets direct Find a project and Create project actions. Preferences live under Profile, rather than taking up the Home screen.
- **Project discovery:** compact project rows show the actual problem, skills, hours, members, experience level, and starter tasks. Search and clearly labeled goal/commitment filters remain visible. Default order is lowest weekly commitment, then name; matching explanations are optional details, rather than a primary panel or score.
- **Project workspace:** members open directly to Tasks. A direct link to Overview still works. Task controls use familiar labels: Add task, Assign to me, Acceptance criteria, and To do / In progress / Done. Filters show all tasks, assigned tasks, or unassigned tasks. On phones, empty status columns are hidden so actual tasks stay higher on the page; the desktop board retains its three columns.
- **Work evidence:** Share work opens the existing real contribution and teammate feedback interface. My projects retains the Contributions history. Team and Resources are directly available; Manage project opens the existing management and integration tools.
- **Create project:** starts with the project title. The form uses Description, First milestone, Project goal, Hours per week, and an explicit public-joining checkbox. The time zone is searchable rather than requiring users to type an IANA identifier. GitHub and AI drafting remain optional sections.
- **Onboarding:** Set up your profile explains the required skill and optional steps. Team preferences are collapsed and optional. Weekly availability is no longer guessed as four hours for a new user who has not supplied it. One Finish setup action accepts empty optional goals; it preserves goals the user has entered. The redundant Skip goals and finish button has been removed.
- **Navigation and labels:** Home, Find a project, Ideas, My projects, and Profile. Mobile uses Home / Explore / Ideas / Projects, with Profile in the account menu. Ideas uses Post an idea and Post idea.
- **Presentation:** neutral backgrounds, smaller headings, standard form controls, modest corner radii, compact rows, and fewer panels. The gold brand action color and saved light/dark preference remain.

## Implementation boundaries

This revision changes frontend presentation and the optional onboarding availability default. It adds no backend endpoint, schema migration, mock application data, authentication shortcut, or dependency. API requests remain in the existing providers. The earlier deployment work is retained; production is unchanged.

Workspace components are split under `frontend/src/app/app/(developer)/build/[id]/` into the page, task board, overview, and team sections, with responsive rules in the route’s `style.ts`. Shared project rows and Home remain under `components/journey/` for compatibility with the existing branch. Internal folder names do not appear as product terminology.

## Verification

In addition to the existing regression and real PostgreSQL-backed flows, `practical-home.spec.ts` checks that a returning developer can see and open an assigned task in the first 360×800 viewport, see the Projects section, and open Share work from the task screen. It checks that a new developer can begin finding a project without scrolling. Landing signup visibility is checked at 360, 768, and 1280px. The real collaboration test covers the updated create, task, contribution, and preferences flows.

Visual screenshots were inspected at phone and desktop widths: overflow checks alone do not demonstrate readable controls or a useful hierarchy. Checks include a visible task after opening it, clear empty states, and the final setup action at phone width.

Final local results on 7 November 2026:

| Check | Result |
| --- | --- |
| Frontend unit/component/provider suite | 237 passed across 60 files |
| Browser suite against the production frontend build | 31 passed, including both real PostgreSQL-backed flows and the two new first-screen usability checks |
| Production build / TypeScript | Passed |
| ESLint | 0 errors; 49 existing warnings remain |
| Responsive checks | 360px, 768px, and 1280px; phone first-screen checks at 360×800 |
| Actual Wi-Fi landing/signup URL | Loaded with signup in the first viewport, no company tenant lookup, no page errors, and no horizontal overflow |
| Source hygiene | Changed handwritten source files below 300 lines; `git diff --check` passed |

The backend is unchanged in this UI revision; the earlier 57 backend tests and Docker/migrator validation are recorded in the linked deployment report. Automated test records were removed from the isolated local feed using the existing test namespace and title checks; user-created work was preserved. No production database was accessed.

Related: [original research and backend decisions](build-together.md), [Render migration rollout](developer-usability-and-render-readiness.md), [tracking issue draft](build-together-issue-draft.md). The issue draft is still local because GitHub CLI authentication is unavailable. No commit, push, or production deployment is part of this local review.
