# Draft: Finish developer journeys and automate repetitive setup

Status: approved by the owner; not filed because GitHub CLI is signed out. Branch: `feature/developer-build-together`. Related: #129 and #130; reviewed closed #48, #62, #67, #69, #94 and #98 for existing behavior.

**Is your feature request related to a problem? Please describe.**

The new workspace sends users to a second workspace for management. Home task links open an entire board, pending invitations are absent from Home, and private projects lack a manual invitation action. Project creation and sharing work repeat information already entered.

**Describe the solution you'd like**

Keep everyday collaboration in one workspace. Add consent-based manual invitations, current-user invitations, precise task links, draft recovery and sensible prefills. Connect tasks to sharing work and feedback without inventing a persisted task/evidence relationship. Preserve advanced existing tools, authorization, optional AI, and the original mosaic.talent branding. Apply restrained visual polish.

**Describe alternatives you've considered**

Further cosmetic changes alone leave the journeys fragmented. Automatically enrolling teammates or publishing projects would remove decisions that belong to users.

**Additional context**

The owner approved the combined plan with “go”. No schema changes, migrations, production changes or push are authorized by this implementation step. Test full browser journeys using real local accounts, access boundaries, recovery, and 360/768/1280px layouts. Document implementation and validation in `developer-journeys.md`.

On 2026-11-12 the owner explicitly authorized pushing the tested work to `main` for deployment, overriding the normal `dev` PR target. They also approved [the public SEO patch](public-seo.md): initial HTML content, public canonical/social metadata, sitemap/robots, private-route noindex headers, and basic public-page keyboard/semantic checks. No new dependencies or schema changes are needed. The pending production database migration step remains the owner's/operator's responsibility under the migration rule.

The owner then approved an explicit exception for automatic startup migrations on free Render. The image must fail before launching the API if migration fails, and its real startup must be checked against the isolated local PostgreSQL database before pushing `main`.
