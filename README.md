# Mosaic Talent

MosaicTalent is an AI-powered hiring intelligence and developer growth platform.

## Design Links

- Figma: https://www.figma.com/design/ANQBVj5jIaFdaiaPcfCEqR/Untitled?node-id=2-879&t=Q1Kvsj8jSpJYwYOp-1
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
  - match insight + likely learning outcomes on project details
- Teamwork simulator:
  - scenario-based sessions with role bots
  - turn-based conversation with assessor feedback
  - communication dimension scoring per turn
- Ask Moahi (AI assistant/operator):
  - full-page command execution across routes/forms/workflows
  - Groq-backed intent planning with deterministic local fallback
  - chatbot + guided step-by-step mode for "how-to" questions
  - manual voice mode (defaults off) with visual execution feedback
- AI peer reviews:
  - auto-generated after completed projects
  - teammate rating (1-10) and AI-generated review questions
  - project-level AI feedback summary + strengths/improvements/tips + growth score
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

## Documentation

- [Docs Index](docs/README.md)
- [AI Matching](docs/feature/ai-matching.md)
- [AI Simulator](docs/feature/ai-simulator.md)
- [Ask Moahi](docs/feature/ai-app-operator.md)
- [AI Peer Reviews](docs/feature/ai-peer-reviews.md)
- [Company Jobs](docs/feature/company-jobs.md)
- [Assessment Connected Workspace UI](docs/feature/assessment-connected-workspace-ui.md)
- [CompanyJob Real Data Refactor](docs/feature/companyjob-real-data-refactor.md)
- [Company Settings Admin Access](docs/feature/company-settings-admin-access.md)
- [Company Analytics Dashboard](docs/feature/company-analytics.md)

## Tenant Resolution Rules

Frontend resolves tenant before auth calls:

1. Vercel pattern:
   - Host contains `mosaic-talent.vercel.app`
   - Reads prefix before `-mosaic-talent`
   - Example: `acme-mosaic-talent.vercel.app` -> `acme`
2. Localhost pattern:
   - `acme.localhost` -> `acme`
3. Generic multi-subdomain pattern:
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
- `GET /api/services/app/DeveloperOnboarding/GetStudyLevels`
- `POST /api/services/app/DeveloperOnboarding/UpsertMyProfile`

### Developer projects

- `GET /api/services/app/DeveloperProject/GetMyProjects`
- `GET /api/services/app/DeveloperProject/GetOpenProjects`
- `GET /api/services/app/DeveloperProject/GetProject`
- `POST /api/services/app/DeveloperProject/CreateProject`
- `POST /api/services/app/DeveloperProject/JoinProject`
- `POST /api/services/app/DeveloperProject/AiMatchProject`
- `POST /api/services/app/DeveloperProject/AiFillTeam`
- `POST /api/services/app/DeveloperProject/AddProjectTask`
- `PUT /api/services/app/DeveloperProject/UpdateProjectTaskStatus`
- `PUT /api/services/app/DeveloperProject/UpdateProjectSkills`
- `POST /api/services/app/DeveloperProject/CompleteProject`

### AI peer reviews

- `GET /api/services/app/PeerReview/GetMyProjectPeerReviews`
- `GET /api/services/app/PeerReview/GetProjectPeerReviews`
- `POST /api/services/app/PeerReview/GenerateProjectPeerReviews`
- `POST /api/services/app/PeerReview/SetPeerReviewRating`
- `POST /api/services/app/PeerReview/SubmitReviewAnswer`

### AI simulator

- `GET /api/services/app/SimulationScenario/GetScenarios`
- `POST /api/services/app/SimulationScenario/CreateScenario`
- `POST /api/services/app/SimulationScenario/StartSession`
- `GET /api/services/app/SimulationScenario/GetSession`
- `POST /api/services/app/SimulationScenario/SendMessage`
- `POST /api/services/app/SimulationVoice/Turn`
- `GET /api/services/app/SimulationVoice/GetVoiceModels`
- `SignalR Hub /signalr-simulation` (realtime turns, bot text/audio events, interrupt support)

### Ask Moahi

- `POST /api/services/app/AppOperator/Plan`

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

# frontend build
npm run build

# backend tests
cd ../aspnet-core
dotnet test
```

## License

MIT
