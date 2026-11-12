# Draft: Make the first shared developer contribution clear and achievable

Status: not filed; GitHub CLI authentication is unavailable. Based on `.github/ISSUE_TEMPLATE/feature_request.md`. Related existing work: #129 and #130. Branch: `feature/developer-build-together`.

**Is your feature request related to a problem? Please describe.**

Developers can create accounts and projects but face a crowded interface without a clear first contribution. Team purpose, sustainable time commitment, a first outcome, and task completion criteria are missing. Local IP hosts can resolve as company tenants. The user approved a research-informed redesign after reviewing the earlier usability fixes.

**Describe the solution you'd like**

Provide a coherent landing, onboarding, Home, team discovery, small project brief, four-tab workspace, starter tasks, preferences, and contribution record. Persist intent, hours, time zone, project purpose/outcome, and task criteria. Preserve real authentication, private access, invitation consent, integrations, and Render migration fixes. Validate locally before any production push.

**Describe alternatives you've considered**

Keeping swipe/AI comparison as the first discovery interaction; adding more dashboard widgets; rewriting all existing project services. The implemented approach exposes explainable preferences and reuses established workflows, retaining advanced tools behind a secondary action.

**Additional context**

The owner approved [completing developer journeys and automating repetitive setup](developer-journeys.md). Its [template-based issue draft](developer-journeys-issue-draft.md) records the expanded scope and defects found by real two-account browser journeys. It remains unfiled because GitHub CLI authentication is unavailable.

The owner approved [restoring the original branding](original-branding.md) and clarified the exact display name as `mosaic.talent`. Reuse the original SVGs unchanged across themes and collapsed navigation, with matching user-facing labels and app metadata.

The approved [desktop sidebar follow-up](desktop-sidebar-scroll.md) corrects the ancestor overflow rule that prevented sticky navigation from remaining visible during page scrolling. The browser regression covers expanded/collapsed desktop navigation and phone/tablet layouts.

The owner subsequently approved a [practical UI correction](practical-developer-ui.md): real tasks/projects first, compact lists, plain labels, optional preferences, and direct task/evidence actions. This replaces the initial visual hierarchy while preserving the real backend and local-only review boundary.

See [research, implementation decisions, and acceptance coverage](build-together.md). Real PostgreSQL-backed tests cover create/join/claim/evidence and access boundaries. Mobile, tablet, desktop, unit, build, lint, and backend checks must pass. User functional review is required before commit/push under the repository workflow.
