# Issue-Driven V1 Workflow

## Purpose

The user writes product issues. The agent selects the next issue by priority, dependencies, and its effect on real user onboarding and usage. The reusable instructions are in [work-prioritized-issues](../../.agents/skills/work-prioritized-issues/SKILL.md); use `$work-prioritized-issues` to request this workflow explicitly.

Existing issues are the tracking source. The git workflow now reuses them rather than creating a duplicate for every implementation. Newly discovered problems use the repository's issue templates and include evidence, release impact, suggested priority, and suggested ownership.

## Approval and Delivery

- Read live issues, comments, assignments, and related pull requests before selecting work.
- Present a concrete implementation plan and wait for explicit approval for each issue. Reapprove material scope changes.
- Branch from current `dev`; implement and validate focused acceptance criteria.
- Document behavior under `docs/feature/` and link it from the root README.
- Wait for user functional testing confirmation before commit, push, or PR. PRs target `dev` and close only fully addressed issues.
- Leave database migration commands to the user and identify any required manual migration.
- Report discovered issues without expanding the current scope automatically. Coordinate before taking over active assigned work.

Creating a GitHub issue is authorized by this workflow; implementing it still requires an approved plan. Merging or deploying is not implicitly authorized. Local implementation, user acceptance, and release readiness are separate states.

## GitHub Access

The repository is [lethabomaepa11/mosaic-talent](https://github.com/lethabomaepa11/mosaic-talent). Public API reads currently work, but GitHub CLI was not authenticated during workflow setup. Run `gh auth login` locally to enable issue creation and PR operations. Never paste tokens into the conversation.

If a write cannot be made, the agent supplies an exact issue draft and states that it has not been filed. Before retrying an uncertain issue creation, check whether an issue was already created.

## Initial Release Queue

Snapshot: 2026-10-11. All 11 open issues were in [MVP 1: Real user onboarding and usage](https://github.com/lethabomaepa11/mosaic-talent/milestone/10); none had explicit priority labels. The milestone's goal is a stable release for real users, keeping features that bring value and removing those that do not. Refresh this queue from GitHub before using it in a later session.

| Proposed order | Issue | Reason and dependencies | Snapshot state |
| --- | --- | --- | --- |
| 1 | [#94 Developer onboarding](https://github.com/lethabomaepa11/mosaic-talent/issues/94) | Required for the first user journey; basic profile completion must be enforced, GitHub and goals optional. | Implemented locally on `feature/94-developer-onboarding`; validation and user review recorded below. Issue remains open. |
| 2 | [#98 Project creation](https://github.com/lethabomaepa11/mosaic-talent/issues/98) | Align project creation with optional GitHub onboarding; resolve the repo requirement in its approved plan. | Open. |
| 3 | [#97 Open project browsing](https://github.com/lethabomaepa11/mosaic-talent/issues/97) | Users need searchable, filterable, sortable opportunities; coordinate overlap with #91. | Open. |
| 4 | [#95 My projects list](https://github.com/lethabomaepa11/mosaic-talent/issues/95), [#96 AI matching entry](https://github.com/lethabomaepa11/mosaic-talent/issues/96) | Improve the post-login starting page; share entry-point decisions but retain separate issue acceptance criteria. | Open. |
| 5 | [#93 Retire AI Simulator](https://github.com/lethabomaepa11/mosaic-talent/issues/93) | Reduce release scope; inspect navigation, search, rating, and other dependencies before removal. | Open. |
| 6 | [#99 Peer review requests](https://github.com/lethabomaepa11/mosaic-talent/issues/99), [#100 Work evidence](https://github.com/lethabomaepa11/mosaic-talent/issues/100) | Support recurring collaboration; resolve review timing and evidence integration in their plans. | Open. |
| Coordinate | [#90 Developer landing page](https://github.com/lethabomaepa11/mosaic-talent/issues/90) | High impact for acquisition and signup; integrate into the first-use release work after ownership coordination. | Open; assigned to lethabomaepa11. |
| Coordinate | [#91 Open projects UX](https://github.com/lethabomaepa11/mosaic-talent/issues/91) | Overlaps #97; inspect existing swipe UI before redesigning it. | Open; assigned to lethabomaepa11. |
| Coordinate | [#92 Collapsible sidebar](https://github.com/lethabomaepa11/mosaic-talent/issues/92) | Usability improvement; higher priority if it prevents mobile use. | Open; assigned to lethabomaepa11. |

This is a proposed order, not a change to GitHub labels, assignments, or milestone membership. Explicit user priority and confirmed blockers take precedence. Assigned issues need coordination, not automatic exclusion from the release.

## Next Implementation Plan: #94

Status: plan approved by the user's `go`; implemented on `feature/94-developer-onboarding`, from `origin/dev`. The approved workflow setup commit is included so this branch carries the new skill. Issue #94 had no comments and the repository had no open PRs when checked on 2026-10-11. The user subsequently requested immediate push, overriding the skill's user-testing gate for this delivery. See [implementation and migration instructions](developer-onboarding-v1.md).

Validation after the immediate-push request: the backend test project passed all 37 tests on the onboarding branch; the full frontend suite passed all 186 tests; the frontend production build and type check passed; targeted lint has no errors (four existing hook dependency warnings). All 14 Edge E2E tests passed, covering onboarding at 360px, 768px, and 1280px, refresh, GitHub connection, manual skills, retry after a failed save, the app route guard, GitHub project creation, and the repository safety gate. The idempotent EF migration script was generated and reviewed but not applied: the migrator default is SQL Server style while this DbContext uses PostgreSQL, the Web.Host default connection is empty, and localhost PostgreSQL is unavailable.

Discovered release concern: [OAuth logout issue #102](oauth-logout-issue-draft.md), filed after a duplicate check and addressed in [PR #104](https://github.com/lethabomaepa11/mosaic-talent/pull/104). #98 remains next in the feature backlog after authentication and onboarding are integrated.

Observed in current code:

- Signup asks for separate name, surname, and username in addition to email and password. The requested flow asks for full name, email, and a strong password.
- Auth provider registration catches failures without rejecting the action; the page proceeds to show success and navigate. Address this within #94's signup acceptance criteria.
- The onboarding page, developer provider, input DTO, entity, and application service require GitHub. The requested flow permits skipping GitHub.
- The onboarding form offers a global skip and the app layout does not enforce persisted completion of basic details.
- The current OAuth callback selects a user through `FindOrCreateTenantUserAsync` even in connect mode. Check and correct connection ownership before using it to attach GitHub to a newly registered account.

Proposed implementation:

1. Simplify signup to full name, email, and password; support full-name registration and a generated unique username server-side while retaining compatibility for existing registration clients. Align password guidance with backend validation and surface failed registration or authentication without a success redirect.
2. Replace the long onboarding form with steps for basic details, optional GitHub connection, editable skills, and optional goals. Save only through provider actions and preserve user edits across OAuth return, refresh, and retry.
3. Make GitHub identity optional in the model and profile APIs. Bind GitHub connections to the authenticated account and derive editable skill suggestions from its repositories. GitHub failures must still permit manual skill entry.
4. Expose persisted onboarding completion and guard developer app routes after session restoration. Completed users land at `/app/projects/my`; company routes retain their own access behavior. Proposed minimum: full name, valid email, and at least one skill; GitHub, goals, avatar, bio, study level, and location are optional. This minimum is a product assumption included in the approval request.
5. Add focused auth/provider/backend tests and Playwright signup/onboarding coverage for required details, optional steps, connection identity, failed API calls, refresh, and direct app navigation. Verify 360px, 768px, and desktop layouts; run frontend unit tests, relevant .NET tests, lint, and frontend build.
6. Add feature documentation and root README links, then request user functional testing before commit/push/PR.

Primary existing files: `frontend/src/app/(auth)/signup/page.tsx` and `style.ts`, `frontend/src/app/onboarding/page.tsx` and `style.ts`, `frontend/src/providers/auth-provider/`, `frontend/src/providers/developer-provider/`, `frontend/src/app/app/layout.tsx`, `aspnet-core/src/MosaicTalent.Application/Authorization/Accounts/`, `aspnet-core/src/MosaicTalent.Application/Services/DeveloperOnboardingService/`, `aspnet-core/src/MosaicTalent.Core/Domains/Developers/`, and the GitHub OAuth controller/service. Extract focused components, helpers, or service partials where needed rather than growing large files.

Existing endpoints: `POST /api/services/app/Account/Register`, `POST /api/TokenAuth/Authenticate`, `GET /api/services/app/Session/GetCurrentLoginInformations`, `GET /api/services/app/DeveloperOnboarding/GetMyProfile`, `POST /api/services/app/DeveloperOnboarding/UpsertMyProfile`, and the `/api/TokenAuth/GitHubAuth`/`GitHubCallback` OAuth flow. Plan a protected `GET /api/services/app/DeveloperOnboarding/GetGithubSkillSuggestions` endpoint for repository-derived suggestions and an authenticated OAuth connection initiation that preserves account ownership.

Model changes for optional GitHub identity and persisted completion may require a manual migration and a compatibility policy for existing profiles. The agent will identify required model/backfill changes and provide instructions; the user must create and apply migrations. Do not run migration commands. Keep #98's project repository policy out of #94 implementation.

## Setup Validation and Handoff

- The skill-creator validator passed for `work-prioritized-issues` and the updated `follow-git-workflow`.
- All four local Markdown references across the changed skill/doc files resolved, and the root README contains the new documentation link.
- `git diff --check` passed. No application code changed, so application test suites were not run for this documentation/skill setup.
- PyYAML, required by the validator, was installed into an isolated temporary folder; project dependencies were unchanged.
- The owner reviewed the workflow and approved proceeding on 2026-10-11. Setup is ready for a local commit; GitHub publication remains pending authentication. No issue was filed, no PR was opened, and no merge or deployment occurred.

## Workflow Setup Tracking Draft

This setup adds skills and documentation only; it does not implement application issues. Its dedicated GitHub tracking issue could not be filed because CLI authentication was unavailable. The intended branch is `chore/issue-priority-workflow`, based on `dev`. The following draft follows the feature request template and can be filed after authentication, following a duplicate check.

Title: Add agent workflow for prioritized v1 onboarding issues

**Is your feature request related to a problem? Please describe.**

The user supplies GitHub product issues, but the current agent workflow requires creating a new issue for every task. That creates duplicates and does not specify how to choose work toward the real-user onboarding milestone.

**Describe the solution you'd like**

Add a repository skill for selecting existing issues by explicit priority, onboarding impact, dependencies, and release risk. Reuse existing tracking issues, report distinct discovered problems using issue templates, and preserve plan approval, validation, documentation, user functional testing confirmation, and PRs to dev. Document the initial release queue and link the workflow from the root README.

Acceptance criteria: the new skill validates; the git workflow permits existing issues; approval rules remain explicit; skill and documentation links resolve; no application code or migrations are changed.

**Describe alternatives you've considered**

Keep the workflow only in conversation, which loses guidance across sessions, or continue creating implementation issues, which duplicates the user's backlog.

**Additional context**

Requested and approved by the repository owner on 2026-10-11. Target: MVP 1: Real user onboarding and usage. Setup branch: chore/issue-priority-workflow. Next proposed product issue: #94.
