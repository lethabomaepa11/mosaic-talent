# AI Simulator Feature

This feature adds a teamwork simulation workflow where developers can practice realistic conversations with role-based bots and receive assessor feedback.

## Backend Model

Implemented domain entities in `MosaicTalent.Core/Domains/Simulations`:

- `SimulationScenario`
- `SimulationScenarioRequiredRole`
- `SimulationSession`
- `ScenarioMessage`
- `SimulationBot`
- `OrchestratorLog`
- `AssessorObservation`
- `AssessorDimensionScore`

Enums:

- `ScenarioRole`
- `SessionType`
- `BotRole`
- `Dimension`

## Backend Service

App service:

- `ISimulationScenarioAppService`
- `SimulationScenarioAppService`

Endpoints:

- `GET /api/services/app/SimulationScenario/GetScenarios`
- `POST /api/services/app/SimulationScenario/CreateScenario`
- `POST /api/services/app/SimulationScenario/StartSession`
- `GET /api/services/app/SimulationScenario/GetSession`
- `POST /api/services/app/SimulationScenario/SendMessage`

Behavior highlights:

- Seeds default scenarios per tenant if none exist.
- Starts session with bot roster based on required roles.
- Stores user and bot messages as turn history.
- Uses Groq for bot response generation when configured.
- Falls back to deterministic bot response if Groq is unavailable.
- Creates assessor observations and dimension scores each turn.

## Frontend

Provider:

- `frontend/src/providers/simulation-provider/*`

Route:

- `frontend/src/app/app/simulator/page.tsx`
- `frontend/src/app/app/simulator/style.ts`

Capabilities:

- browse scenarios
- contribute new scenarios (title, prompt, bot count, required roles)
- start a session
- chat with simulation bots
- view latest assessor feedback and score dimensions

## Data / Migration

DbContext updates were made in:

- `aspnet-core/src/MosaicTalent.EntityFrameworkCore/EntityFrameworkCore/MosaicTalentDbContext.cs`

Run migration commands locally:

```bash
cd aspnet-core
dotnet ef migrations add AddSimulationScenarioFeature --project src/MosaicTalent.EntityFrameworkCore --startup-project src/MosaicTalent.Web.Host
dotnet ef database update --project src/MosaicTalent.EntityFrameworkCore --startup-project src/MosaicTalent.Web.Host
```
