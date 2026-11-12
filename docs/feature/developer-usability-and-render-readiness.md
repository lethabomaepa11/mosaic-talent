# Developer usability and Render readiness

Reviewed: 2026-11-07. Branch: `fix/developer-usability-render-readiness`.
Related issues: [#129 Ideator](https://github.com/lethabomaepa11/mosaic-talent/issues/129) and [#130 private workspaces](https://github.com/lethabomaepa11/mosaic-talent/issues/130).

## Developer journey

Mosaic Talent helps developers learn through real team projects and meet potential cofounders. The first useful journey is: create an account, add a skill, find or describe a problem, form a team by invitation or joining, contribute, document work, and exchange feedback. GitHub and AI assistance are optional.

Project creation now starts with the problem and proposed solution. Visibility defaults to private and its meaning is explained. Difficulty and weekly commitment have practical guidance. AI drafting and GitHub are collapsed optional sections. GitHub requests start only when that section opens, so an unavailable GitHub service cannot block creation without a repository. Selected repositories still need a completed safe scan. The overview editor opens in edit mode instead of split preview; primary actions stay accessible on phones.

Repository controls, AI drafting, and the main form are separate files below 300 lines. All HTTP calls remain in providers. GitHub connection uses the authenticated auth-provider action rather than a component-built authentication URL.

Ideator distinguishes loading, error, and empty states. Failed requests offer an in-place retry. Failed submissions keep drafts; in-flight submissions prevent repeated clicks. Private idea confirmations explain visibility. Converted ideas link to their project. If a write succeeds but refreshing the feed fails, the confirmed result remains visible and the UI offers refresh recovery instead of reporting a failed save.

Browser metadata now describes collaboration, learning, and cofounders. Local development allows the existing Playwright origin `127.0.0.1`.

The owner also approved a signup fix found during live validation: the browser previously accepted passwords up to 128 characters while the backend accepts at most 32. The form now states and enforces the existing 32-character limit. Backend field validation messages are shown instead of the generic invalid-request message; failed forms keep their values. Authentication endpoints, cookie/session behavior, and provider ordering are unchanged. Tenant resolution remains outside the auth provider because session restoration depends on resolved tenancy.

The auth-route guard previously unmounted forms for every pending login/registration action. It now waits on initial session restoration while leaving submitted forms mounted. This prevents local field values and error displays from disappearing during rejected submissions. Authenticated users still redirect to the workspace.

## Migration diagnosis

Feature code was deployed without the corresponding schema migration. The old Dockerfile published only `MosaicTalent.Web.Host`; starting that DLL does not run the separate migrator. The migrator also looked for logging configuration in the caller's working directory, so invoking it from the repository root failed.

Migration `20261107141846_IdeatorAndPrivateProjectWorkspace` adds:

- `Projects.IsPublic` and `Projects.ProblemStatement`. Existing projects retain public visibility.
- `IdeaPosts`, `IdeaComments`, and `IdeaReactions`, with indexes.
- `ProjectWikiPages` and `ProjectResources`, with indexes.

The forward migration is additive. The generated designer and snapshot retain normal EF-generated structure. No production database was modified.

The runner now finds logging configuration beside its executable. Tenant failures produce a failed batch and nonzero quiet-mode exit. Other tenants still run; shared successful connections migrate once. Failed connections are not marked complete. Tenant exception details are excluded from batch logs because they may contain credentials.

The image publishes the migrator under `/app/migrator`. `/app/run-migrations.sh` requires an explicit PostgreSQL connection, runs the quiet migrator, and preserves its exit status. Web startup remains independent of migrations.

Repository policy normally reserves migration commands for the owner. In this chat the owner explicitly instructed the agent to run them, overriding that restriction for this work. The generated migration was reviewed and applied only to the isolated local database.

## Local preview

- Frontend: `http://localhost:3000`.
- Backend: `http://localhost:44311/swagger`.
- PostgreSQL container: `mosaic-talent-mvp1-local-db`, bound to `127.0.0.1:55432`.
- The database began with an empty migration history. All 25 discovered migrations and seeding completed.
- The hosted Neon connection in the ignored backend `.env` was not used. The backend runs from its build-output directory with an explicit local connection and ephemeral development signing key.
- This machine has .NET 10 but not the .NET 9 runtime. Local commands use `DOTNET_ROLL_FORWARD=Major`; the Docker image supplies .NET 9.

Restart the local backend with `aspnet-core/docker/start-local-preview.ps1`. Start the frontend separately from `frontend` with `npm run dev`. Sign up through the UI for a real local developer account; there are no demo-login shortcuts.

## Production rollout after local review

**2026-11-12 update:** the owner confirmed a free Render service and approved automatic startup migrations. The current image's `/app/start-web.sh` now runs the reviewed migrator before execing the API, exiting if migration fails. A paid pre-deploy hook is no longer required. Keep `ConnectionStrings__Default` set to the intended production database, and clear a conflicting Render Docker Command override. See [current SEO/release decisions](public-seo.md). The instructions below describe the earlier separate-job/paid-hook rollout option.

Do not regenerate the migration. Review and commit the migration, designer, snapshot, and deployment changes together after functional review. Set `ConnectionStrings__Default` securely in Render to the target PostgreSQL database; the migrator's template JSON is not production configuration.

On a paid Render service, set **Pre-Deploy Command** to:

```sh
/app/run-migrations.sh
```

Render runs this after the image build and before starting the new version. A failing command must block deployment. See [Render deploy steps](https://render.com/docs/deploys#pre-deploy-command).

If that service plan does not support pre-deploy commands, an operator can run a separate migration job from the reviewed image before deploying the matching web image:

```sh
docker run --rm --env ConnectionStrings__Default --entrypoint /app/run-migrations.sh <reviewed-image>
```

Use the same image/version for migration and web startup. Do not run migrations during Docker build or rely on every web replica changing the schema. Verify `__EFMigrationsHistory`, then exercise authenticated Ideator/workspace operations. Inspect schema mismatches rather than using `EnsureCreated` or fabricating migration history.

Production settings and migration execution remain pending local review. The branch has not been pushed or deployed.

## Validation

Validated on 2026-11-07:

- `npm test`: 58 files, 214 tests passed.
- `npm run build`: passed, including TypeScript validation and static-page generation.
- `npm run lint`: zero errors, 51 warnings. Existing lint debt was not expanded into this fix.
- `npm run test:e2e -- --workers=1`: all 28 tests passed against the local production frontend build, using the installed Edge executable.
- Backend test suite: all 57 tests passed, including model/snapshot consistency and tenant migration failure/deduplication cases.
- Docker image build: passed. The image contains the executable migrator and logging configuration. Its entry script returned exit 2 with no connection configured, and exit 0 on a repeat migration of the isolated local database.
- The production Docker web host started against the local database and returned HTTP 200 for Swagger, including Ideator routes. The temporary Docker web container was stopped after verification.
- Real local signup, onboarding without GitHub, idea sharing, another developer's interest, private project conversion, invitation acceptance, and shared wiki editing passed without API mocks. An interested/invited developer had no wiki access before accepting membership.
- The remaining browser fixtures isolate external integrations and exercise API failures; they do not prove live GitHub, external AI, or email-provider configuration.
- Project form and signup checks cover 360px, 768px, and 1280px. Project creation screenshots at 360px and 1280px were visually inspected. No horizontal overflow was detected.
- `git diff --check`: passed.

Both the frontend at `http://localhost:3000` and the backend at `http://localhost:44311` remain running. The frontend preview uses the verified production build; it does not hot-reload edits. To return to development mode, stop that frontend server and run `npm run dev` from `frontend`.

## Owner functional review

1. Open the local frontend and create a real account.
2. Skip GitHub, add a skill, and finish onboarding.
3. Open Create Project and enter a title, problem, and solution. Confirm that AI and GitHub are optional and private visibility is clear.
4. Open Ideator, share an idea, and convert it into a project. Follow Open project to the workspace.
5. Check the same flow at a narrow mobile width and desktop width.

No commit, push, PR, issue closure, or production deployment has been performed. Functional review is the next step before the git workflow proceeds.
