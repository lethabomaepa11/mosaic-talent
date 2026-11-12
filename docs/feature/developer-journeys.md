# Developer journeys and everyday automation

Approved scope: practical developer journeys, repeated-entry reduction, and restrained visual polish. Display name remains **mosaic.talent**, with the original SVG assets. Work stays local until user review. Tracking: [unfiled issue draft](developer-journeys-issue-draft.md), related to existing #129 and #130.

## Observed problems and behavior

| Journey | Previous friction | Change |
| --- | --- | --- |
| Start a project | Re-enter known skills, availability and goals; leave with an empty board | Prefill from the current profile; review a checked option to turn the first milestone into an unassigned starter task |
| Resume a form | Unfinished project, task or work update lost on refresh | Per-account, per-project session drafts; retain failed submissions and clear successful ones |
| Invite a teammate | Private projects depended on idea conversion or AI invitations | Lead searches existing developers and explicitly sends an invitation; pending invitations appear on the recipient's Home |
| Join a team | Invitation buried in notifications or a project link | Review the brief, acknowledge weekly hours and accept; open Tasks after joining |
| Continue work | Home's Open task opened a whole board | Exact task query/anchor, focus outline and scroll; expandable list exposes every assigned task |
| Share a contribution | Re-enter the task title and context | Task action opens Work & feedback with editable prefills; evidence and reflection remain the developer's input |
| Receive feedback | Separate, hard-to-find modal and review paths | Persistent Work & feedback tab and direct contribution-history link; peer-feedback eligibility explained in Team |
| Manage or finish | Everyday actions required a second workspace | Team roles/mentors/removal and completion/leave/delete in the main workspace; advanced legacy tools remain behind More project tools |

## Boundaries and implementation decisions

- No new entity or schema migration. `BuildJourney/InviteMember` uses existing `ProjectTeamInvite`; `GetMyInvitations` returns only the current developer's pending invitations to open projects, under tenant/soft-delete filters.
- Invitation sends require active membership and owner/lead permission. Recipient lookup joins tenant-filtered active users to developer accounts. Existing members cannot be invited. Repeated pending invitations are idempotent; pending invites count toward capacity. A project-row write serializes concurrent manual invitations in the ABP transactional unit of work. Existing AI/join writers retain their established behavior.
- Notification delivery failure does not undo a saved invitation. Home provides a persistent way to discover it. Acceptance and rejection reuse existing endpoints and consent/access policies.
- First-task creation is opt-in in the request, exposed as a reviewed checkbox in the UI, and runs in the project-creation unit of work. No automatic enrolment, assignment, publication or project completion.
- Session storage contains only unfinished form fields, keyed by current user and project/task. It stores no authentication/session state. Drafts survive refresh within that browser tab; they do not sync between devices and may disappear when the tab closes. Blocked storage never prevents submission.
- Sharing from a task supplies editable title/context only. There is no new persisted task/evidence relationship and saving evidence does not silently change task status.
- Confirmed progress/review writes remain successful if their subsequent list refresh fails. This prevents a misleading retry from duplicating already saved work.
- Real project UUID links under `/app/projects/:id` temporarily redirect to `/app/build/:id`, preserving query parameters. `?tools=1` retains advanced meetings, repository safety, complaints and optional AI tools, with a visible return link. Non-ID creation/discovery routes are unchanged.
- Completion requires at least one task and every task Done. Deletion remains sole-member-owner only. Leaving requires a handover and another lead where required; UI explains these restrictions before submission. Backend remains authoritative.
- Visual polish uses theme tokens, neutral dark surfaces, clearer secondary text, modest radii/shadows, aligned desktop header and focus/hover states. Desktop sticky sidebar behavior and mobile navigation remain intact.
- Workspace navigation uses two compact rows on phones so Tasks, Overview, Team, Resources, Work & feedback, and Settings stay visible. Small selects use real option elements for accessible selection rather than virtualized placeholder options.
- Invitations refresh when Home regains focus and every 30 seconds while visible. Inbox refreshes preserve unrelated Home errors. Confirmed declines disappear even if the follow-up refresh fails.
- Workspace provider caches reset when the authenticated account or tenant changes; real authentication and appearance stay outside that boundary. Work evidence is filtered by the current project before display.
- Contribution history retains the author's work after leaving. Former project names are plain text rather than links into an inaccessible private workspace; current project links open Work & feedback directly.

## Defects found by exercising the journeys

- **Phone onboarding:** the skill-tag dropdown could cover Continue after Enter. Skill/goal dropdowns now close after selection. The mobile regression no longer presses Escape to work around the defect.
- **Inviting by name:** search previously matched first and last names separately but missed the full displayed name. Full-name matching is now included.
- **First project completion:** the first gamification award inserted a new engagement profile and then called Update on the unsaved entity. EF marked it Modified and PostgreSQL raised a concurrency error because the row did not exist. New profiles retain Added state; a regression verifies entity state before saving, plus successful PostgreSQL-backed completion.
- **Peer feedback:** completed projects already prepare assignments automatically. Removed the redundant Generate Reviews button and linked directly to the current project's reviews. Saving an answer keeps its confirmed text visible and its accessible button name stable while loading. Questions are sanitized in a single pass with word boundaries and protected neutral phrases; overlapping participant names no longer produce repeated anonymous labels. Automated summaries remain collapsed and secondary.
- Split the existing peer-review application service into methods, commands, queries, and mapping files under 300 lines while retaining its public endpoints and permissions. No migration was generated or applied.

## Validation

The completed validation run passed 268 frontend tests, 64 backend tests, and all 34 browser tests. Frontend production and backend Docker builds passed. Lint reported zero errors and 56 warnings. The source line-limit audit and `git diff --check` passed; original logo SVGs are unchanged.

The two-account browser journey performs signup, onboarding, project/task/work draft recovery, private-project creation, manual task assignment, invitation decline/re-invitation/acceptance, task claiming/status, contribution sharing, teammate feedback, completion, anonymous peer feedback, role handover, leaving, contribution retention and deletion through the UI. Direct API requests supplement these interactions only for access-boundary checks. Existing real idea-conversion and public-join journeys remain in the regression suite. Phone, tablet and desktop checks cover 360px, 768px and 1280px; desktop sidebar expanded/collapsed scrolling remains covered.

At the end of the original local-journey scope, production had not been deployed or validated, and no migrations were run for that scope. On 2026-11-12 the owner authorized direct publication to `main` and approved [SEO and free Render startup migrations](public-seo.md), including an explicit exception for automatic container migrations. Production deployment results must be checked separately from local validation. GitHub CLI was signed out, so the tracking draft is not a filed issue.

### Local preview continuation

On 2026-11-12, port 3000 was occupied by a different project. Its process was preserved. Mosaic's existing local PostgreSQL container and API were restarted without migrations; the frontend uses port 3002. Preview: `http://192.168.0.238:3002/app` while that Wi-Fi address remains assigned. The API listens on port 44311. Restarting the API rotates its local signing key, so existing preview sessions may require sign-in again.

Playwright now honors `PLAYWRIGHT_BASE_URL`; its secondary browser context and GitHub onboarding fixture use the selected origin. Run against the isolated local preview with `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002` and `LOCAL_LIVE_API_URL=http://127.0.0.1:44311`. Form drafts are confined to their browser tab and do not sync between devices. Advanced legacy tools remain secondary; this is a focused developer-journey implementation, not a rewrite of every legacy screen.

The 2026-11-12 repeat passed all 34 browser tests against port 3002, including real PostgreSQL-backed journeys. The two-account test now waits for each tab's selected state before measuring or capturing it, and checks that the last team action can be reached by scrolling on a phone. Standalone TypeScript checking and all five sidebar unit checks passed. Corrected a Testing Library selector that used Playwright's unsupported `exact` option. Only the new run's generated project/idea records were soft-deleted after checking their reserved test-account namespace and the isolated database binding; recovery IDs are logged in the local temporary cleanup ledger. No other project's process was stopped.
