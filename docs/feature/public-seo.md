# Public SEO and accessibility basics

Approved on 2026-11-12 before the requested main-branch deployment. The landing previously rendered a spinner in its initial HTML until client-side tenant resolution. Its metadata lacked canonicals, share cards and crawl discovery routes.

## Behavior

- Public landing content now renders in the initial HTML, including its heading, navigation and signup links. Tenant-host redirects still run after tenant resolution; no authenticated content is exposed.
- Public home and Getting started have distinct titles, descriptions, canonical URLs, Open Graph and Twitter metadata. The canonical origin defaults to the existing deployment `https://mosaic-talent.vercel.app`. Set `NEXT_PUBLIC_SITE_URL` at build time if deploying on an owned custom domain; do not use a preview or local URL as the production canonical.
- `/opengraph-image` produces a 1200 × 630 PNG using the unchanged original wordmark SVG and existing theme colors. Inline image styles are required by Next's ImageResponse renderer; browser route styling remains in colocated createStyles files.
- `/sitemap.xml` lists only `/` and `/how-to`, without querying account/project data or inventing freshness dates. `/robots.txt` points at that sitemap and excludes workspace/account/API/assessment routes.
- Private routes also send `X-Robots-Tag: noindex, nofollow`. These crawler instructions supplement existing real authorization; they are not an access-control mechanism or a guarantee that every crawler honors them.
- Public CTAs are single anchor elements instead of buttons nested inside links. A keyboard skip link moves focus to the landing main content. The pages retain a main landmark, heading hierarchy, document language, meaningful logo alternative text and mobile layout.

## Validation and limits

Tests check initial-page reading/navigation with JavaScript disabled, keyboard skip-link behavior, public metadata, PNG format/dimensions, sitemap URLs and private response headers. The existing phone/tablet/desktop and real collaboration journeys remain required before push. A full WCAG audit, Google Search Console submission, ranking promises, live third-party integrations and a custom-domain change are outside this patch. Search engines decide whether and when to index pages.

The approved release passed the production frontend build, 271 frontend unit tests and all 36 browser tests (including two public SEO checks). Lint has zero errors and 56 existing/follow-up warnings. The PNG was visually inspected using the original logo. Built HTML contains the main heading before JavaScript runs; home and guide canonicals, social-image URLs and private headers were checked against the running production build.

The owner subsequently confirmed that the backend uses free Render and explicitly approved automatic container-startup migrations as an exception to the manual-migration rule. The image now starts through `/app/start-web.sh`: it runs the reviewed migrator and only execs the API after success. A migration failure exits startup. No paid pre-deploy hook, one-off job, or migrations during Docker build are required. `ConnectionStrings__Default` must still identify the production database in Render's environment. Clear an old Docker Command override so Render uses this image entrypoint.

Startup migration is a deliberate free-tier tradeoff: every cold start performs an idempotent schema check and may take longer. Keep migrations compatible with the old version during deploy overlap. EF Core's database migration lock and the migrator's shared-connection deduplication apply; this is not a replacement for a paid deployment migration job if the service later scales to multiple instances. The agent does not run standalone production migration commands.

Container verification used a separate disposable database in the isolated local PostgreSQL container. The startup script applied all 26 migrations to the fresh database and served Swagger with the new endpoints. The final release image then started against that database again with unchanged migration history and returned HTTP 200; `dotnet` owned PID 1 for normal shutdown signals. That final image exited 2 with no connection and exited 1 after a deliberately failed migration, without starting the API. Backend tests passed 64/64. No production database was accessed for these checks.

The owner authorized direct publication to `main`, overriding the usual `dev` PR workflow. The remote's additional merge commits were fast-forwarded first; its file tree was identical, and no force push is needed. Deployment completion is checked separately from git publication. Google indexing and full WCAG conformance are not implied by passing these SEO and semantic checks.

GitHub's main-branch rule requires a pull request, so publication uses PR #140 rather than bypassing protection. Its first frontend CI run exposed missing global React cleanup with Vitest globals disabled: assertions passed, but an unmounted jsdom environment received queued React work. The shared test setup now explicitly unmounts roots after every test; this changes test lifecycle only.
