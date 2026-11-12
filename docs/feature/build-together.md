# Build together: developer experience

> The initial visual direction below was revised after owner feedback. See [Practical developer UI](practical-developer-ui.md) for the current interface and validation. Backend/data decisions and research remain applicable.

Approved direction: 7 November 2026. Branch: `feature/developer-build-together`. This work preserves the earlier usability and Render migration fixes. Local review is required before commit/push; production has not been changed.

## The product decision

Help developers turn a learning goal or product idea into a first useful contribution with people they can work with. The primary journey is **choose a purpose → find a suitable team → agree on a small outcome → claim a task → show evidence → learn from feedback**.

The interface uses a warm paper background, readable green text, restrained gold actions, simple illustrations made in CSS, and a light default theme. Existing saved appearance choices still apply. Counts, members, contributions, and availability come from real endpoints; there are no manufactured community metrics or demo sessions.

## Research and its implications

These sources informed design choices; they do not validate market size, retention, pricing, or revenue.

- [Steinmacher et al., systematic literature review (2015)](https://experts.nau.edu/en/publications/a-systematic-literature-review-on-the-barriers-faced-by-newcomers/): the review grouped newcomer barriers into social interaction, knowledge, getting started, documentation, and technical hurdles. We make starter tasks, completion criteria, and team resources visible. This is historical open-source research, not a survey of all developers today.
- [GitHub’s maintainer guidance](https://github.blog/open-source/maintainers/healthy-and-sustainable-communities/) and [contribution guidance](https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-open-source): clear contribution instructions, approachable work, and supportive interactions help newcomers participate. A task now explains what someone should know and what done looks like.
- [YC cofounder matching experiences](https://www.ycombinator.com/blog/does-co-founder-matching-work): trial projects offer a way to learn about a potential partner through work. Cofounder discovery is a project purpose, with explicit trial language, rather than a promise of compatibility.
- [NN/g progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) and [empty states](https://www.nngroup.com/articles/empty-state-interface-design/): primary actions should stay clear while secondary complexity remains accessible. The workspace has four main tabs; repository tools and AI remain secondary. Empty pages explain a useful next action.
- [The Collab Lab’s published process](https://the-collab-lab.codes/our-processes/): collaborative project practice, feedback, and shared ownership informed the journey. The program is historical; Mosaic does not advertise its mentorship or claim its outcomes.

Our inference is that a small, finishable shared outcome is a better initial organizing principle than a long feature menu or an unexplained match score. That inference needs testing with developers using the product.

## What changed

| Surface | Behavior |
| --- | --- |
| `/` | Clear developer promise; interactive learning/product/cofounder paths; no invented testimonials or usage totals. |
| `/onboarding` | Collaboration intent, optional weekly hours and time zone, editable skills; GitHub remains optional; completion opens Home. |
| `/app` | Useful first action, real build preferences, current builds, assigned work, and open teams. |
| `/app/projects/open` | Search real problems/skills, filter purpose and weekly commitment, explain fit from preferences. Replaces the swipe deck and primary AI comparison panel. |
| `/app/projects/create` | Purpose and first deliverable alongside problem/solution, commitment, skills, and private-by-default visibility. GitHub and AI are optional collapsible sections. |
| `/app/build/[id]` | Overview, Board, Team, Resources; joining requires an explicit time commitment; existing workload confirmation remains enforced. |
| `/app/work` | Active/finished builds and the current developer’s real contribution evidence and review counts. |
| `/app/build-profile` | Simple preferences editing; full profile and GitHub settings stay available. |
| `/app/ideator` | Problem-first framing, collapsed composer, real discussion, consent-based conversion invitations, links into the new workspace. |
| Navigation | Home, Teams, Ideas, Your work. Profile/settings/feedback/help in the account menu. Assistant available under Help rather than floating over every developer page. |

Existing `/app/projects/[id]` URLs remain supported for integrations, repository work, team management, meetings, completion, and moderation. New journey links open `/app/build/[id]`; its **Tools & integrations** action opens the established workspace. Existing services and access rules are reused rather than duplicating their authorization policies. Company navigation and dashboard behavior remain intact.

Team fit is deterministic: shared skills/goals, a project commitment within stated availability, exact matching time-zone identifier, and shared purpose. At most three reasons appear. There are no probability claims or inferred schedule overlaps; an unset preference makes no corresponding fit claim. An hours budget measures the individual project, not total remaining capacity. The existing workload check handles joining commitments.

## Backend and data

The authenticated `BuildJourney` service composes existing project/onboarding operations. Frontend calls remain in the four-file `build-provider`, with a separate normalizer. It exposes `GetHome`, `GetBuild`, `CreateBuild`, `CreateTask`, `ClaimTask`, `SetTaskStatus`, and `GetMyContributions`.

- Profiles store collaboration intent, nullable weekly hours (1–40), and an optional time-zone identifier.
- Projects store purpose, first outcome (up to 800 characters), and team time zone.
- Tasks store a starter flag and acceptance criteria (up to 2,000 characters).
- Profile writes from older clients that omit collaboration intent preserve all three collaboration preferences. Sending intent explicitly permits clearing optional preferences.
- `ClaimTask` uses one conditional database update: only an unassigned, unfinished task in the specified project can be claimed. Repeating a successful claim by the same developer is safe. Concurrent claims have one winner.
- Writes require active team membership. The new status action requires the assignee or lead/owner. Existing management endpoints retain their established policies.
- Private project access delegates to the existing project service. Contribution history is limited to the authenticated developer, with at most 100 recent entries; it is not a public portfolio or a verified achievement certificate.
- IP literal hosts use developer tenancy. `192.168.0.238` no longer becomes a company called `168`. Real numeric tenant subdomains continue to resolve normally.
- A current completed profile remains mounted during background profile refresh. Another user’s cached profile still cannot satisfy the onboarding guard.

Migration `20261107151900_DeveloperBuildJourney` adds the fields without replacing existing data. Standard EF-generated migration metadata and the model snapshot are exempt from the handwritten-file size limit. The new migration was generated and applied only to the isolated local PostgreSQL container, under the user’s explicit authorization to run local migrations. Production migration application remains a deployment step; see [the Render rollout guide](developer-usability-and-render-readiness.md).

## Commercial hypothesis and success criteria

The initial user is a developer who wants real collaboration practice or a small product/cofounder trial. A possible paying customer is a bootcamp, university program, or facilitated cohort that needs structured team practice and observable contribution evidence. Billing, cohort administration, paid mentorship, and institutional reporting are not implemented here. Pricing and willingness to pay are unvalidated.

Before expanding features, observe consenting pilot teams: time to first team, time to first claimed task, first evidence submission, teammates returning to give feedback, and a completed first deliverable. Interview teams that stop contributing. Do not equate registration totals or task checkbox counts with learning outcomes. No revenue outcome is promised.

## Local review and verification

Use the isolated preview startup described in the rollout guide; do not run from a directory whose `.env` points to a hosted database. Frontend preview must expose port 3000 to the same Wi-Fi network and point to the LAN API on 44311. The browser retains its own authenticated account; no preview login shortcut exists.

Automated coverage includes provider successes/failures, fit explanations, IP tenancy, profile-refresh continuity, real signup/onboarding, idea conversion/invitations/wiki collaboration, real build creation, a concurrent task claim, access denial, contribution isolation, and responsive checks at 360/768/1280px. The live test also checks a non-assignee cannot change task status, shows real evidence under Contributions, edits weekly availability in the UI, and reloads to verify persistence. Screenshots are test artifacts, not seeded production content.

Final verification on 7 November 2026:

| Check | Result |
| --- | --- |
| Frontend unit/component/provider tests | 237 passed across 60 files |
| Backend tests | 57 passed |
| Browser suite against the built frontend | 29 passed, including both opt-in real PostgreSQL-backed flows |
| Frontend production build / TypeScript | Passed |
| ESLint | 0 errors; 49 warnings remain, primarily existing hook and image warnings |
| Backend Docker image | Built `mosaic-talent:build-together-local` |
| Migrator from that image | Exit 2 without configuration; exit 0 on repeat application to the isolated local database |
| Actual Wi-Fi URL at 360px | Loaded landing/signup; 0 company tenant lookups, 0 page errors, no horizontal overflow |
| Handwritten changed source files | Below 300 lines; `git diff --check` passed |

The phone preview runs the production frontend build on `0.0.0.0:3000` with the API at `192.168.0.238:44311`; the Wi-Fi address is machine-specific. No permanent LAN address was written into the app's production configuration. Test records are identified by reserved `example.invalid` email namespaces and generated titles. The 12 leftover test projects and 6 test ideas from repeated validation runs were soft-deleted only in the isolated local database; recovery IDs are retained in the task's local cleanup log. User accounts and user-created work were not removed. The real build test cleans up its own projects through the existing leave/delete workflows.

## Tracking and remaining rollout work

The previous backlog review covered open and closed GitHub issues and relevant PR history, including [#129](https://github.com/lethabomaepa11/mosaic-talent/issues/129) and [#130](https://github.com/lethabomaepa11/mosaic-talent/issues/130). Those features were already merged; deployment/schema state was the missing dependency. They should not be closed based on local validation alone.

The broader redesign needs its own tracking issue. GitHub CLI authentication is unavailable in this session; a [template-based issue draft](build-together-issue-draft.md) is ready. Local implementation is not represented as a filed GitHub issue. Production deployment, user acceptance, pricing validation, GitHub OAuth on deployed domains, and external AI integrations with real credentials remain separate review steps.
