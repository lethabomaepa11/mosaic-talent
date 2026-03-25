# Mosaic Talent

MosaicTalent is an AI-Powered Hiring Intelligence and talent development platform.

## Overview

Mosaic Talent combines a Next.js frontend with an ASP.NET Boilerplate (ABP) backend to support authentication, user management foundations, and API-driven product development. The repository currently includes the core platform scaffolding, auth provider state management on the frontend, and ABP application services on the backend.

The product direction is broader: AI-assisted hiring decisions, team simulation, peer review intelligence, growth insights, and company-side assessment workflows. This README documents both the current implementation and the agreed roadmap items.

## Design

| Resource | Link |
| --- | --- |
| Figma Design | [View Designs](https://www.figma.com/design/ANQBVj5jIaFdaiaPcfCEqR/Untitled?node-id=2-879&t=Q1Kvsj8jSpJYwYOp-1) |
| Frontend Live Demo | [mosaic-talent.vercel.app](https://mosaic-talent.vercel.app) |
| Backend Base URL | [api-mosaic-talent.onrender.com](https://api-mosaic-talent.onrender.com) |

## Tech Stack

| Tool | Purpose |
| --- | --- |
| Next.js 16.2.1 | Frontend app framework |
| React 19.2.4 | UI runtime |
| TypeScript 5.x | Type-safe frontend development |
| Axios 1.13.6 | HTTP client for API calls |
| redux-actions 3.0.3 | Provider action/reducer pattern |
| Vitest 4.1.1 + Testing Library | Frontend unit/integration tests |
| ASP.NET Core (.NET 9) | Backend web host |
| ASP.NET Boilerplate 10.2.0 | Application/service architecture |
| Entity Framework Core 9 | Data access and migrations |
| PostgreSQL provider (Npgsql) | Primary relational DB provider |
| Swashbuckle 8.1.2 | Swagger/OpenAPI docs |
| Docker Compose | Containerized backend runtime |

## Roles

### Current backend roles and permissions

| Feature/Permission | Host Admin | Tenant Admin |
| --- | :---: | :---: |
| `Pages.Tenants` | Yes | No |
| `Pages.Users` | Yes | Yes |
| `Pages.Users.Activation` | Yes | Yes |
| `Pages.Roles` | Yes | Yes |

### Product roadmap roles

| Capability | Developer/Candidate | HR | Company Admin |
| --- | :---: | :---: | :---: |
| Profile and skill goals | Yes | No | No |
| Team/project participation | Yes | No | No |
| Job posting and assessments | No | Yes | Yes |
| Hiring review workflows | No | Yes | Yes |

## Features

### Implemented in repository

- Frontend auth provider with `login`, `register`, and `logout` actions.
- Token and auth user persistence via cookies + `localStorage`.
- Axios instance with bearer token interceptor.
- ABP backend with JWT authentication endpoint (`TokenAuthController`).
- Account registration app service and core CRUD-style ABP modules for users, roles, tenants.
- Swagger UI enabled at `/swagger` in backend host.
- Frontend and backend test projects present.

### Planned product features (Roadmap)

- Company-specific authentication experience and onboarding flow.
- GitHub OAuth during candidate application.
- GitHub profile and repository analysis using:
- `https://profile-summary-for-github.com/api/user/`
- `https://api.github.com/users/`
- AI-assisted profile enrichment when users trigger GitHub sync.
- AI candidate insights: code quality scoring, growth potential, and interview question suggestions.
- Team matchmaking (user-selected team or AI-assigned team).
- AI-managed project membership with creator email notifications.
- AI-generated peer review forms based on skills and goals.
- AI teammate simulator for scenario-based behavioral assessment and coaching.
- AI-selected team leader recommendations.
- Company hiring assessments based on collaborative ticket execution.
- Candidate simulation assessments focused on teamwork dynamics.
- HR-facing behavior and teamwork rating visibility.

### Extended roadmap modules

- AI Coach / Personal Growth Agent.
- Team Health Dashboard.
- Skill Gap Analysis and Learning Paths.
- Multi-Person Simulator.
- Code Review Simulator.
- Meeting Role-Play Simulator.
- Portfolio / Exportable Growth Profile.
- Integration Hub (GitHub and additional tooling).
- Gamification Layer.
- AI Project Idea Generator.
- Smart Ticket Suggestions.
- Progress Pulse Checks.
- Learning roadmap engine.
- Mentor matching.
- Role-specific simulation scenarios.

## Domain Model (Planned)

| Entity / Aggregate | Key Attributes | Relationships | Prototype Note |
| --- | --- | --- | --- |
| User (Root) | `id`, `name`, `email`, `avatar`, `role`, `githubUsername` | Owns Profile | Persist as `currentUser` in localStorage |
| Profile (VO) | `skills[]`, `goals[]`, `bio`, `location`, `teamworkRating`, `visibilityToHR` | Belongs to User | Editable in profile area |
| Project (Root) | `id`, `title`, `description`, `status`, `creatorId`, `maxMembers`, `memberCount`, `createdAt` | Has ProjectMembers + Tickets | Main project workspace entity |
| ProjectMember | `projectId`, `userId`, `role`, `joinedAt` | Links User and Project | AI matchmaking can add members |
| Ticket | `id`, `title`, `description`, `status`, `assigneeId` | Belongs to Project | Kanban-style workflow |
| PeerReview | `id`, `projectId`, `reviewerId`, `revieweeId`, `formAnswers`, `submittedAt` | Links users in project context | Generated post-project |
| ReviewFeedback (VO) | `strengths[]`, `improvementAreas[]`, `actionableSteps[]`, `growthScore` | Attached to PeerReview | AI synthesized |
| SimulationSession | `id`, `userId`, `scenarioType`, `messages[]`, `finalScore`, `feedback`, `completedAt` | Belongs to User | Multi-turn AI simulation |
| Job | `id`, `companyName`, `title`, `description`, `assessmentType`, `status` | Has many Assessments | Company-side hiring module |
| Assessment (Root) | `id`, `jobId`, `candidateId`, `ticketId`, `status`, `githubScanResult`, `scores`, `insightReport` | Links Job and candidate | Orchestrates evaluation flow |
| GitHubScanResult (VO) | `reposAnalyzed`, `codeQualityScore`, `strengths[]`, `suggestedQuestions[]` | Attached to Assessment/Profile | Triggered by GitHub scan |
| InsightReport (VO) | `codeQuality`, `teamworkScore`, `growthTrend`, `potentialProjection`, `developmentAreas[]`, `recommendation` | Attached to Assessment | Final AI insight artifact |

## Project Structure

```text
mosaic-talent/
|-- .agents/
|-- .github/
|-- AGENTS.md
|-- LICENSE
|-- README.md
|-- rename.ps1
|-- frontend/
|   |-- AGENTS.md
|   |-- CLAUDE.md
|   |-- package.json
|   |-- next.config.ts
|   |-- eslint.config.mjs
|   |-- tsconfig.json
|   |-- vitest.config.ts
|   |-- public/
|   `-- src/
|       |-- app/
|       |   |-- layout.tsx
|       |   `-- page.tsx
|       |-- providers/
|       |   |-- index.tsx
|       |   `-- auth-provider/
|       |       |-- actions.tsx
|       |       |-- context.tsx
|       |       |-- index.tsx
|       |       |-- reducer.tsx
|       |       `-- __tests__/
|       `-- utils/
|           `-- axiosInstance.ts
`-- aspnet-core/
    |-- MosaicTalent.sln
    |-- build/
    |-- docker/
    |   |-- docker-compose.yml
    |   `-- up.ps1
    |-- src/
    |   |-- MosaicTalent.Application/
    |   |-- MosaicTalent.Core/
    |   |-- MosaicTalent.EntityFrameworkCore/
    |   |-- MosaicTalent.Migrator/
    |   |-- MosaicTalent.Web.Core/
    |   `-- MosaicTalent.Web.Host/
    `-- test/
        |-- MosaicTalent.Tests/
        `-- MosaicTalent.Web.Tests/
```

## API Integration

**Backend Base URL (prod):** `https://api-mosaic-talent.onrender.com`

**Frontend env key for API base URL:** `NEXT_PUBLIC_API_BASE_URL`

### Internal API modules (ABP)

| Module | Example Endpoint(s) |
| --- | --- |
| Token Auth | `POST /api/TokenAuth/Authenticate` |
| Account | `POST /api/services/app/Account/Register`, `POST /api/services/app/Account/IsTenantAvailable` |
| Session | `GET /api/services/app/Session/GetCurrentLoginInformations` |
| User | `/api/services/app/User/*` |
| Role | `/api/services/app/Role/*` |
| Tenant | `/api/services/app/Tenant/*` |
| Configuration | `POST /api/services/app/Configuration/ChangeUiTheme` |

### Planned external integrations

| Integration | Endpoint |
| --- | --- |
| GitHub profile summary | `https://profile-summary-for-github.com/api/user/` |
| GitHub users API | `https://api.github.com/users/` |

## State Management

Frontend state currently uses a provider pattern under `frontend/src/providers`.

- `AuthProvider` composes React Context + reducer state.
- Actions are created with `redux-actions`.
- Reducer transitions are handled with `handleActions`.
- Auth token/user are persisted in browser storage and attached to requests via Axios interceptor.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- .NET SDK 9.0+
- PostgreSQL (recommended by current backend `.env.example`)
- Git

### Installation

```bash
# 1) Clone
git clone <repository-url>
cd mosaic-talent

# 2) Frontend deps
cd frontend
npm install
cd ..

# 3) Backend restore
cd aspnet-core
dotnet restore
cd ..
```

### Environment Variables

Frontend currently relies on a local `.env` file. Backend has an example file at `aspnet-core/src/MosaicTalent.Web.Host/.env.example`.

| Variable | Description | Required |
| --- | --- | :---: |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend API base URL | Yes |
| `ConnectionStrings__Default` | Backend DB connection string | Yes |
| `Authentication__JwtBearer__SecurityKey` | JWT signing key | Yes |
| `GitHub__ClientId` | GitHub app client id | Optional (GitHub features) |
| `GitHub__ClientSecret` | GitHub app client secret | Optional (GitHub features) |
| `GitHubOAuth__ClientId` | GitHub OAuth client id | Optional (OAuth login) |
| `GitHubOAuth__ClientSecret` | GitHub OAuth client secret | Optional (OAuth login) |
| `GitHubOAuth__RedirectUri` | OAuth callback URL | Optional (OAuth login) |
| `GitHubApp__AppId` | GitHub App id | Optional (GitHub App flows) |
| `GitHubApp__PrivateKeyPem` | GitHub App private key | Optional (GitHub App flows) |
| `GitHubApp__WebhookSecret` | Webhook signature validation secret | Optional (Webhooks) |
| `Groq__ApiKey` | AI inference API key | Optional (AI features) |
| `Vercel__Token` | Vercel integration token | Optional (deployment integration) |
| `Brevo__ApiKey` | Email delivery key | Optional (email notifications) |

### Running Locally

```bash
# Terminal 1: backend
cd aspnet-core/src/MosaicTalent.Web.Host
dotnet run

# Terminal 2: frontend
cd frontend
npm run dev
```

- Frontend default: `http://localhost:3000`
- Backend default profile: `https://localhost:44311`
- Swagger: `https://localhost:44311/swagger`

### Test Credentials

Not yet defined.

## Testing

```bash
# Frontend
cd frontend
npm test

# Backend
cd ../aspnet-core
dotnet test
```

## Building for Production

```bash
# Frontend
cd frontend
npm run build
npm start

# Backend
cd ../aspnet-core/src/MosaicTalent.Web.Host
dotnet build -c Release
```

### Docker (backend)

```bash
cd aspnet-core/docker
docker compose up --build
```

## License

MIT
