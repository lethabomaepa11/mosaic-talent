# Mosaic Talent

MosaicTalent is an AI-powered hiring intelligence and developer growth platform.

## Design Links

- Figma: https://www.figma.com/design/ANQBVj5jIaFdaiaPcfCEqR/Untitled?node-id=2-879&t=Q1Kvsj8jSpJYwYOp-1
- Domain Model (Lucid): https://lucid.app/lucidchart/2b80556d-bf37-4480-b88c-a88e975bdfb0/edit?viewport_loc=-242%2C-2359%2C4469%2C2051%2C0_0&invitationId=inv_fd837c65-e5cf-4e75-ac97-2a1cba27e779
- Frontend (Vercel): https://mosaic-talent.vercel.app
- Backend API (Render): https://api-mosaic-talent.onrender.com

## Current Architecture

- Frontend: Next.js App Router + Ant Design + `antd-style`
- Backend: ASP.NET Boilerplate (ABP) on ASP.NET Core
- Multi-tenancy: ABP tenant model with tenant resolution on frontend
- Storage: Cloudflare R2 (S3-compatible) for image uploads (company logos + avatars)

## Tech Stack (Actual)

### Frontend

- `next` 16.2.1
- `react` 19.2.4
- `react-dom` 19.2.4
- `typescript` 5.x
- `antd` 6.3.4
- `antd-style` 4.1.0
- `axios` 1.13.6
- `framer-motion` 12.38.0
- `@microsoft/signalr` 9.0.10
- `redux-actions` 3.0.3
- Testing: `vitest` 4.1.1 + Testing Library

### Backend

- .NET 9
- ASP.NET Boilerplate 10.2.0
- Entity Framework Core (via ABP stack)
- PostgreSQL (Npgsql provider)
- `AWSSDK.S3` 3.7.413.3 (used for Cloudflare R2)
- Swagger (`Swashbuckle.AspNetCore` 8.1.2)

## Implemented Features

- Tenant-aware auth and session restore.
- Shared `/login` page with tenant branding:
  - company logo + company name shown when tenant is resolved.
  - self-signup link hidden on company tenant login.
- User signup + developer onboarding flow.
- Company account creation flow (creates tenant + owner admin).
- Company employee model and management service groundwork.
- Domain-based tenant resolution on frontend:
  - `company-mosaic-talent.vercel.app` -> `company`
  - `company.localhost` -> `company`
  - generic domains use last subdomain segment before the base domain
- Automatic `Abp-TenantId` header management.
- Image upload endpoints and frontend upload UX:
  - company logo upload
  - developer avatar upload
- AI project matching:
  - open projects sorted by match score
  - AI Match redirect to best-fit project
  - excludes projects where developer is already a member
  - match insight + likely learning outcomes on project details
- AI learning path recommendations:
  - profile-based skill-gap analysis against market role tracks
  - personalized next-step actions for career progression goals
  - resilient fallback recommendations when AI response is unavailable
  - profile skills and learning goals now receive AI suggestion chips and typing suggestions
- Gamification layer:
  - developer points and levels for collaboration/growth actions
  - badge unlocks for review participation and project completion; previously earned simulation badges remain recorded
  - profile progression card and reward feedback within review workflows
- Ask Moahi (AI assistant/operator):
  - full-page command execution across routes/forms/workflows
  - Groq-backed intent planning with deterministic local fallback
  - chatbot + guided step-by-step mode for "how-to" questions
  - manual voice mode (defaults off) with visual execution feedback
- AI peer reviews:
  - auto-generated after completed projects
  - teammate rating (1-10) and AI-generated review questions
  - project-level AI feedback summary + strengths/improvements/tips + growth score
- Teamwork rating governance:
  - teamwork rating is system-managed (not user-editable)
  - rating is derived from peer reviews and historical AI simulation performance
- Company jobs:
  - company admin job posting management in `/app/jobs`
  - developer + public job applications with source + lifecycle status
  - anonymous resume upload (PDF-only) + CV parsing (skills/GitHub extraction)
  - AI application assessment (match score, strengths, weaknesses, verdict)
  - branded applicant emails with configurable template mode (manual/AI) from jobs page settings
  - job application review pipeline (applied -> shortlisted -> assessment -> interview -> rejected/approved) + bulk assessment transition
  - assessment workflow:
    - assessment generated at application time
    - application received email includes assessment link
    - public `/assessment/[id]` submission page
    - AI/heuristic scoring updates application score + verdict + reasons
    - LeetPrompt-style coding experience with 2+ runnable problems and public test execution
    - per-problem AI prompt assistant with token tracking and accepted-prompt selection
    - final score blends public test pass-rate + prompt quality + token efficiency + code quality
- Notification channels + PWA:
  - in-app notification feed with unread counters and mark-as-read actions
  - web push subscription management backed by VAPID
  - installable PWA manifest + service worker for push click routing
  - mobile wrapper scaffold (Capacitor) and desktop wrapper scaffold (Electron)
- GitHub project repo picker:
  - project creation requires connected GitHub account
  - repositories are fetched from GitHub and selected from dropdown
  - inline repository creation when no suitable repo exists
  - repository creation failure now returns reconnect guidance when GitHub token permissions are insufficient
- Repo safety scan:
  - on-demand repository safety scan via `scanrepo.dev`
  - Safe/Risk tag shown on project cards and project detail
- Workspace route guards with route groups:
  - `(company)` and `(developer)` app route partitions
  - layout-level access enforcement so developers cannot access company segments and vice versa
  - shared routes (for example `/app/profile`) remain outside restricted groups
- Public developer profiles:
  - anonymous `/developers/[username]` profile page with skills, current projects, and completed projects
  - project member names link to public profiles from project details
- Global search in the header:
  - Autocomplete combines developer matches (via `SearchPublicDevelopers`) and project names.
  - Selecting a suggestion navigates to the matching developer profile or project detail.
- Project collaboration upgrade:
  - project details now use tabs (`Repo Safety`, `Team`, `Project Spec`, `Repo Analysis`, `Tasks`, `Meetings`)
  - AI Fill Team now sends member invites (in-app + email when configured) instead of force-adding members
  - invited users can accept/reject from project detail; rejected invites notify project lead(s)
  - project meetings support request/schedule/cancel, Jitsi joins, and per-member reminders
  - leads can remove project members with a required reason
  - non-lead members can log complaints to project lead(s)
  - project creation moved to `/app/projects/create` with a dedicated AI prompt section and realtime markdown editor/preview
  - `Generate Project` action in AI section updates title, markdown, and skills together
  - markdown and skills each include a focused `Use AI` action
  - AI difficulty/hours estimates now include anti-default heuristics to reduce repeated `intermediate` + `20h/week` outputs
  - markdown editor now follows light/dark theme for readable contrast
  - AI project idea generation now returns a structured markdown spec format
  - optional "Use README as Description" on selected GitHub repo
  - join flow warns on high workload/overlap and supports explicit override

## Documentation

- [Docs Index](docs/README.md)
- [AI Matching](docs/feature/ai-matching.md)
- [AI Simulator retirement](docs/feature/ai-simulator-retirement.md)
- [AI Simulator historical implementation](docs/feature/ai-simulator.md)
- [Ask Moahi and operator testing](docs/feature/ai-app-operator.md)
- [AI Peer Reviews](docs/feature/ai-peer-reviews.md)
- [Company Jobs](docs/feature/company-jobs.md)
- [Company Profile Role Labels](docs/feature/company-profile-role-labels.md)
- [Custom 404 Page](docs/feature/custom-404-page.md)
- [Mobile Tabs and Header Responsiveness](docs/feature/mobile-tabs-and-header-responsiveness.md)
- [Discover Mobile Swipe Layout](docs/feature/discover-mobile-swipe-layout.md)
- [Remove Image URL Inputs Except Page Builder](docs/feature/remove-image-url-inputs-except-page-builder.md)
- [Assessment Connected Workspace UI](docs/feature/assessment-connected-workspace-ui.md)
- [CompanyJob Real Data Refactor](docs/feature/companyjob-real-data-refactor.md)
- [Company Settings Admin Access](docs/feature/company-settings-admin-access.md)
- [Company Analytics Dashboard](docs/feature/company-analytics.md)
- [Notifications, PWA, Mobile, and Desktop](docs/feature/notifications-pwa-mobile-desktop.md)
- [GitHub Repo Picker for Project Creation](docs/feature/github-repo-picker-project-create.md)
- [Dark Mode Logo Asset Switching](docs/feature/darkmode-logo-asset-switching.md)
- [Assessment Submission Task/File Processing](docs/feature/assessment-submission-task-file-processing.md)
- [GitHub Candidate Background Analysis](docs/feature/github-candidate-background-analysis.md)
- [Repo Safety Scan](docs/feature/repo-safety-scan.md)
- [Repo Safety Auto-Enforcement](docs/feature/repo-safety-auto-enforcement.md)
- [Project Leave + Lead Role Assignment](docs/feature/project-leave-and-member-role-assignment.md)
- [Project Delete Restricted To Sole Member](docs/feature/project-delete-sole-member-only.md)
- [Project Member Moderation And Complaints](docs/feature/project-member-moderation-and-complaints.md)
- [AI Learning Path Recommendations](docs/feature/ai-learning-path-recommendations.md)
- [Gamification: Badges, Points, and Levels](docs/feature/gamification-badges-points-levels.md)
- [Tenant Resolution for mosaictalent.co.za](docs/feature/tenant-resolution-mosaictalent-domain.md)
- [Company Signup Tenant Redirect Fix](docs/feature/company-signup-tenant-redirect-fix.md)
- [Agent Issue Template Workflow](docs/feature/agent-issue-template-workflow.md)
- [GitHub OAuth Production Cookie Domain Fix](docs/feature/github-oauth-prod-cookie-domain-fix.md)
- [Route Groups + Company/Developer Guards](docs/feature/route-groups-company-developer-guards.md)
- [Public Developer Profiles and Project Visibility](docs/feature/public-profiles-project-visibility.md)
- [Tasks Header Full-Width](docs/feature/tasks-header-full-width.md)
- [Project Collaboration Tabs, Meetings, and Markdown Specs](docs/feature/project-collaboration-tabs-meetings-markdown.md)
- [Project Detail Team Tab Split](docs/feature/project-detail-team-tab-split.md)
- [AI Task Generation From Spec + Repo Analysis](docs/feature/ai-task-generation-spec-repo-analysis.md)
- [Task Reassignment And Task Notifications](docs/feature/task-reassignment-notifications.md)
- [Join Loader And Discover Project Navigation](docs/feature/join-loader-and-discover-project-navigation.md)
- [AI Fill Team Invite Workflow](docs/feature/ai-fill-team-invite-workflow.md)
- [Exclude Joined Projects From Open List And AI Match](docs/feature/open-ai-match-exclude-joined.md)
- [Project Detail Loading And 404 Fallback](docs/feature/project-detail-loading-and-404.md)
- [Auth Route Group Guard](docs/feature/auth-route-group-guard.md)
- [Restrict Landing On Subdomain](docs/feature/restrict-landing-on-subdomain.md)
- [Company Email Template Types](docs/feature/company-email-template-types.md)
- [Company Job Social Share + Copy Link](docs/feature/company-job-social-share.md)
- [Peer Reviews Project Flow + Anonymous Reviews](docs/feature/peer-reviews-project-flow-anonymous.md)
- [Profile AI Skill and Goal Suggestions](docs/feature/profile-ai-skill-goal-suggestions.md)
- [Teamwork Rating System-Managed](docs/feature/teamwork-rating-system-managed.md)
- [GitHub Identity Lock And Scan Flow Update](docs/feature/github-identity-lock-and-scan-flow-update.md)
- [Ask Moahi Role-Scoped Actions](docs/feature/moahi-role-scoped-actions.md)
- [Company Dashboard Uses Reports](docs/feature/company-dashboard-uses-reports.md)
- [Gamification Badge Threshold Fix](docs/feature/gamification-badge-threshold-fix.md)
- [Company Reports PDF/Excel Export](docs/feature/company-reports-export-pdf-excel.md)
- [Company AI Viz Lab](docs/feature/company-ai-viz-lab.md)
- [Global Opening + Closing Transition](docs/feature/global-opening-closing-animation.md)
- [R2 Image Host Allowlist + CI E2E Removal](docs/feature/r2-image-host-allowlist-and-ci-e2e-removal.md)

## Tenant Resolution Rules

Frontend resolves tenant before auth calls:

1. Vercel pattern:
   - Host contains `mosaic-talent.vercel.app`
   - Reads prefix before `-mosaic-talent`
   - Example: `acme-mosaic-talent.vercel.app` -> `acme`
2. Production domain pattern (`mosaictalent.co.za` by default):
   - Host in format `<tenant>.mosaictalent.co.za`
   - Extracts subdomain closest to root domain as tenant
   - Example: `acme.mosaictalent.co.za` -> `acme`
3. Localhost pattern:
   - `acme.localhost` -> `acme`
4. Generic multi-subdomain pattern:
   - Uses the last subdomain before registrable domain
   - Example: `company.app.domain.com` -> `app`

Then frontend calls:

- `POST /api/services/app/Account/IsTenantAvailable`

If tenant is available, resolved `tenantId` is attached as `Abp-TenantId` to API requests.

## Authentication and Account Flows

- Developer login: `/login`
- Developer signup: `/signup`
- Developer onboarding: `/onboarding`
- Company signup: `/company/signup`
- Company login: `/company/login` (legacy route retained), shared login branding now handled on `/login`

After successful company creation, frontend redirects user to tenant login URL.

## API Surface (Current)

### Auth / session / tenancy

- `POST /api/TokenAuth/Authenticate`
- `POST /api/services/app/Account/Register`
- `POST /api/services/app/Account/IsTenantAvailable`
- `GET /api/services/app/Session/GetCurrentLoginInformations`

### Developer onboarding

- `GET /api/services/app/DeveloperOnboarding/GetMyProfile`
- `GET /api/services/app/DeveloperOnboarding/SearchPublicDevelopers`
- `GET /api/services/app/DeveloperOnboarding/GetPublicProfile`
- `GET /api/services/app/DeveloperOnboarding/GetStudyLevels`
- `GET /api/services/app/DeveloperOnboarding/GetMyLearningPathRecommendations`
- `GET /api/services/app/DeveloperOnboarding/GetMyGamificationSummary`
- `POST /api/services/app/DeveloperOnboarding/GetProfileFieldSuggestions`
- `POST /api/services/app/DeveloperOnboarding/UpsertMyProfile`

### Developer projects

- `GET /api/services/app/DeveloperProject/GetMyProjects`
- `GET /api/services/app/DeveloperProject/GetOpenProjects`
- `GET /api/services/app/DeveloperProject/GetProject`
- `GET /api/services/app/DeveloperProject/GetGithubConnectionStatus`
- `GET /api/services/app/DeveloperProject/GetMyGithubRepositories`
- `POST /api/services/app/DeveloperProject/CreateGithubRepository`
- `POST /api/services/app/DeveloperProject/CreateProject`
- `POST /api/services/app/DeveloperProject/JoinProject`
- `GET /api/services/app/DeveloperProject/GetJoinProjectLoadWarning`
- `POST /api/services/app/DeveloperProject/LeaveProject`
- `DELETE /api/services/app/DeveloperProject/DeleteProject`
- `POST /api/services/app/DeveloperProject/RemoveProjectMember`
- `POST /api/services/app/DeveloperProject/SubmitProjectComplaint`
- `POST /api/services/app/DeveloperProject/AiMatchProject`
- `POST /api/services/app/DeveloperProject/AiFillTeam`
- `GET /api/services/app/DeveloperProject/GetProjectInvites`
- `POST /api/services/app/DeveloperProject/AcceptProjectInvite`
- `POST /api/services/app/DeveloperProject/RejectProjectInvite`
- `POST /api/services/app/DeveloperProject/AiGenerateProjectTasks`
- `POST /api/services/app/DeveloperProject/AddProjectTask`
- `POST /api/services/app/DeveloperProject/ReassignProjectTask`
- `PUT /api/services/app/DeveloperProject/UpdateProjectTaskStatus`
- `PUT /api/services/app/DeveloperProject/AssignMemberRole`
- `PUT /api/services/app/DeveloperProject/UpdateProjectSkills`
- `POST /api/services/app/DeveloperProject/CompleteProject`
- `POST /api/services/app/DeveloperProject/ScanRepoSafety`
- `GET /api/services/app/DeveloperProject/GetRepositoryReadme`
- `POST /api/services/app/DeveloperProject/AiGenerateProjectSpec`
- `GET /api/services/app/DeveloperProject/GetProjectMeetings`
- `POST /api/services/app/DeveloperProject/RequestProjectMeeting`
- `POST /api/services/app/DeveloperProject/ScheduleProjectMeeting`
- `POST /api/services/app/DeveloperProject/SetProjectMeetingReminder`
- `POST /api/services/app/DeveloperProject/CancelProjectMeeting`

### AI peer reviews

- `GET /api/services/app/PeerReview/GetMyProjectPeerReviews`
- `GET /api/services/app/PeerReview/GetProjectPeerReviews`
- `POST /api/services/app/PeerReview/GenerateProjectPeerReviews`
- `POST /api/services/app/PeerReview/SetPeerReviewRating`
- `POST /api/services/app/PeerReview/SubmitReviewAnswer`

### AI simulator (retired)

These endpoints remain for historical records. `CreateScenario` and `StartSession` reject new work.

- `GET /api/services/app/SimulationScenario/GetScenarios`
- `GET /api/services/app/SimulationScenario/GetSession`
- `POST /api/services/app/SimulationScenario/SendMessage`
- `POST /api/services/app/SimulationVoice/Turn`
- `GET /api/services/app/SimulationVoice/GetVoiceModels`
- `SignalR Hub /signalr-simulation` (realtime turns, bot text/audio events, interrupt support)

### Ask Moahi

- `POST /api/services/app/AppOperator/Plan`

### Notifications

- `GET /api/services/app/NotificationChannel/GetMyNotifications`
- `POST /api/services/app/NotificationChannel/MarkNotificationAsRead`
- `POST /api/services/app/NotificationChannel/MarkAllNotificationsAsRead`
- `GET /api/services/app/NotificationChannel/GetPushPreferences`
- `POST /api/services/app/NotificationChannel/UpsertPushSubscription`
- `POST /api/services/app/NotificationChannel/RemovePushSubscription`

### Company account

- `POST /api/services/app/CompanyAccount/CreateCompanyAccount`
- `GET /api/services/app/CompanyAccount/GetCompanyBrandingByTenancyName`
- `GET /api/services/app/CompanyAccount/GetMyCompany`
- `GET /api/services/app/CompanyAccount/GetMyCompanyEmployees`
- `POST /api/services/app/CompanyAccount/AddCompanyEmployee`
- `POST /api/services/app/CompanyAccount/UpdateEmployeeRole`

### Company jobs

- `GET /api/services/app/CompanyJob/GetOpenJobs`
- `POST /api/services/app/CompanyJob/ApplyToPublicJob`
- `GET /api/services/app/CompanyJob/GetPublicJobsPage`
- `GET /api/services/app/CompanyJob/GetMyJobs`
- `GET /api/services/app/CompanyJob/GetJob`
- `POST /api/services/app/CompanyJob/CreateJob`
- `PUT /api/services/app/CompanyJob/UpdateJob`
- `PUT /api/services/app/CompanyJob/ToggleJobOpenStatus`
- `GET /api/services/app/CompanyJob/GetJobApplications`
- `POST /api/services/app/CompanyJob/ApplyToJob`
- `PUT /api/services/app/CompanyJob/UpdateJobApplicationStatus`
- `GET /api/services/app/CompanyJob/GetAssessment`
- `POST /api/services/app/CompanyJob/SubmitAssessment`

### File upload (R2)

- `POST /api/files/upload` (authorized)
- `POST /api/files/upload-public` (public upload endpoint used by company signup + public job resumes)

## Environment Configuration

## Frontend (`frontend/.env`)

- `NEXT_PUBLIC_API_BASE_URL` (required)
- `NEXT_PUBLIC_DEFAULT_ABP_TENANT_ID` (optional, default `1`)

## Backend (`aspnet-core/src/MosaicTalent.Web.Host/.env`)

Minimum required:

- `ConnectionStrings__Default`
- `Authentication__JwtBearer__SecurityKey`

Cloudflare R2 (required for uploads):

- `R2__AccountId`
- `R2__AccessKeyId`
- `R2__SecretAccessKey`
- `R2__BucketName`
- `R2__PublicBaseUrl` (recommended)

Also supported:

- `GitHub__ClientId`
- `GitHub__ClientSecret`
- `GitHub__RedirectUri`
- `GitHubOAuth__ClientId`
- `GitHubOAuth__ClientSecret`
- `GitHubOAuth__RedirectUri`
- `GitHubApp__AppId`
- `GitHubApp__Name`
- `GitHubApp__PrivateKeyPem`
- `GitHubApp__WebhookSecret`
- `Groq__ApiKey`
- `Deepgram__ApiKey`
- `Deepgram__TtsModel` (optional default fallback model)
- `Vercel__Token`
- `Brevo__ApiKey`
- `Brevo__SenderEmail` (required for outbound emails)
- `Brevo__SenderName` (optional)
- `WebPush__PublicKey`
- `WebPush__PrivateKey`
- `WebPush__Subject`

See example file:

- `aspnet-core/src/MosaicTalent.Web.Host/.env.example`

## Docker Compose

Backend compose file:

- `aspnet-core/docker/docker-compose.yml`

It now passes through all key env vars including JWT, GitHub, Groq, Brevo, Vercel, and R2 settings.

## Local Development

### 1) Install dependencies

```bash
# frontend
cd frontend
npm install

# backend
cd ../aspnet-core
dotnet restore
```

### 2) Run services

```bash
# backend
cd aspnet-core/src/MosaicTalent.Web.Host
dotnet run

# frontend
cd frontend
npm run dev
```

Defaults:

- Frontend: `http://localhost:300X` (can be 3000, 3001, ... 300X)
- Backend: `http://localhost:44311` (or profile-specific)
- Swagger: `http://localhost:44311/swagger`

### 3) Test tenant locally

Add hosts entries as needed and test, for example:

- `acme.localhost:300X`

Tenant branding should appear on `/login` if tenancy is resolvable and company branding exists.

## Testing and Build

```bash
# frontend tests
cd frontend
npm test

# frontend e2e tests
npm run test:e2e

# frontend build
npm run build

# backend tests
cd ../aspnet-core
dotnet test
```

## License

MIT
