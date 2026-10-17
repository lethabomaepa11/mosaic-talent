# Developer Onboarding V1

Tracking issue: [#94](https://github.com/lethabomaepa11/mosaic-talent/issues/94). Branch: `feature/94-developer-onboarding`. The user explicitly requested immediate commit/push during validation, overriding the skill's functional-review gate for this delivery. Fresh PostgreSQL migration, live-backend endpoint, and browser validation were subsequently completed. Release readiness still depends on target-environment configuration and the full MVP 1 queue.

## Account and onboarding flow

Signup now asks for full name, email, and a strong password. New full-name registrations require at least eight characters, an uppercase letter, a lowercase letter, a digit, and a symbol, with no whitespace. Backend password policy still applies. Registration and authentication failures remain on signup with an error; a failed request never navigates as a success. An account that cannot log in yet reports that condition explicitly.

The backend splits full name into name and surname, supports a single-word name, and generates a unique username from a sanitized name prefix and random suffix. Email is not embedded in public usernames. Existing clients using name, surname, and username remain supported.

Developer onboarding has four steps:

1. Confirm the name and email from the registered account.
2. Optionally connect GitHub, or skip it.
3. Add at least one current skill; edit or remove imported suggestions.
4. Optionally add learning goals, or skip goals and finish.

Full name, email, and at least one nonblank skill are required. GitHub, goals, avatar, biography, location, study level, and experience are optional. Registered account details are displayed rather than duplicated in the onboarding profile form. There is no action that skips mandatory basics. Completion lands at `/app/projects/my`.

Drafts are saved through the developer provider when advancing or connecting GitHub. The backend stores the current step and completion separately. Unsaved skill and goal edits are cached per user in `sessionStorage` for refresh recovery; this cache contains form values only, never tokens, authenticated session state, name, or email. It is cleared after successful saves and completion. If browser storage is unavailable, server-saved drafts still work. A failed save retains the current values and allows retry.

## Completion and route protection

`GetMyProfile` returns account metadata even before a developer record exists, including `userId`, `fullName`, `emailAddress`, `hasCompletedOnboarding`, and `onboardingStep`. `UpsertMyProfile` accepts `completeOnboarding` and `onboardingStep` (0 through 3).

Draft saves may have no skills. Completion requires account basics and at least one skill on the server. Ordinary profile updates preserve completion; completed profiles must keep at least one skill. Manually submitted GitHub usernames are ignored, including for new profiles: identity is written by OAuth only.

The developer app guard waits for session restoration and a profile belonging to the current user. Incomplete users are redirected to `/onboarding`; profile-load errors keep app content hidden and offer retry. Completed users visiting onboarding go to their projects. Company routes retain their existing access guards and bypass developer onboarding.

Auth wraps appearance and domain providers. Tenant resolution remains outside Auth because session requests need the resolved tenant first; this is the dependency-driven exception to the auth skill's outermost-provider guidance.

## GitHub connection and skills

`POST /api/TokenAuth/BeginGitHubConnection` requires a bearer-authenticated account. Its protected state binds user ID, tenant ID, an allowlisted return path, and a ten-minute expiry. A browser state cookie is also checked at callback. Allowed destinations are `/onboarding`, `/app/profile`, and `/app/projects/create`.

The callback connects the GitHub identity to that signed-in account even when GitHub email differs. It rejects identities linked to another user, an attempt to replace an existing linked identity, and unavailable or mismatched accounts. Existing GET links using `mode=connect` pass through `/github/connect`, which restores the frontend session and calls the authenticated initiation action. Normal GitHub login remains supported.

`GET /api/services/app/DeveloperOnboarding/GetGithubSkillSuggestions` uses only the current user's encrypted GitHub token. It reads up to 300 recently updated owned repositories, excludes forks, and suggests distinct primary programming languages. These are editable suggestions, not a complete assessment of proficiency or repository contents. Each GitHub request has a 15-second timeout. Disconnected accounts return no suggestions; unavailable GitHub requests leave manual skill entry usable.

Deployment continues to require the existing GitHub OAuth configuration, callback URL, credentialed CORS, HTTPS cookie support, and a stable/shared ASP.NET Data Protection key ring when using multiple backend instances. Browser tests intercept external APIs; live OAuth still needs user testing.

## Migration validation and deployment prerequisites

The EF migration `20261011231642_DeveloperOnboardingV1` changes the nullable GitHub username, the two onboarding columns, and the filtered GitHub identity index. It is included in the repository migration sequence.

A disposable PostgreSQL 16 database was created from empty state and migrated successfully through the repository migrator, including seed data. The backend was then started against that migrated database and a live session endpoint plus Swagger responded successfully. The later project and work-evidence migrations were also validated through the same local migration workflow.

A deployment target still needs its own configured PostgreSQL connection and a migration run before the backend starts. Keep production credentials outside source control. Before applying the onboarding migration to an existing database, audit active GitHub usernames case-insensitively, resolve duplicate ownership with account owners, normalize retained identities to lowercase, and choose whether eligible existing profiles should be backfilled as onboarding-complete.

See [Fresh PostgreSQL Bootstrap](fresh-postgresql-bootstrap.md) for the local migration workflow and validated fresh-database result.

## Validation and user review

Automated coverage includes full-name registration and failures, profile drafts and completion, provider error propagation, signed account ownership, protected OAuth tickets, GitHub language suggestions, account-specific draft storage, and route guards. Playwright exercises the provider-backed UI with intercepted API responses, including 360px, 768px, and 1280px layouts, optional steps, refresh recovery, editable imports, and retry paths. Validation results are recorded in the issue workflow handoff.

After the manual migration, test against the real backend:

1. Register a new email with full name and a strong password; confirm errors do not redirect or show success.
2. Skip GitHub, verify an empty skill list blocks progress, add a skill, skip goals, and reach My Projects.
3. Refresh during onboarding and revisit an app URL before completion; confirm saved drafts resume and app content stays protected.
4. On another new account, connect GitHub with a different email, edit imported skills, and finish; confirm the original account remains signed in and owns the connection.
5. Test a denied GitHub connection and failed profile save; confirm manual entry and retry retain work.
6. Check a 360px phone and desktop, including primary buttons, tagged inputs, and no horizontal page overflow.
7. Visit onboarding as a completed user and verify company navigation still works.

The related OAuth logout cookie issue is tracked separately as [#102](oauth-logout-issue-draft.md), with its fix submitted in PR #104.
