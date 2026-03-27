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
- `POST /api/services/app/SimulationVoice/Turn`
- `GET /api/services/app/SimulationVoice/GetVoiceModels`

Realtime endpoint:

- `Hub /signalr-simulation` (SignalR)

Behavior highlights:

- Seeds default scenarios per tenant if none exist.
- Starts session with bot roster based on required roles.
- Stores user and bot messages as turn history.
- Uses Groq for bot response generation when configured.
- Falls back to deterministic bot response if Groq is unavailable.
- Creates assessor observations and dimension scores each turn.
- Supports realtime turn flow over SignalR:
  - client emits `SendUserMessage`
  - server emits `simulation_turn_started`
  - server emits `simulation_session_updated`
  - server emits `simulation_bot_text`
  - server emits `simulation_bot_audio`
  - server emits `simulation_turn_completed`
  - client can emit `Interrupt` to barge-in
- Applies backend-owned voice mapping per bot role (frontend does not choose voices):
  - facilitator -> `aura-2-orion-en`
  - stakeholder -> `aura-2-athena-en`
  - teammate/member -> `aura-2-angus-en`
  - assessor -> `aura-2-helios-en`
  - orchestrator -> `aura-2-zeus-en`
  - default fallback -> `aura-2-thalia-en`

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
- pure voice mode with always-on recognition
- realtime simulator messaging over SignalR with HTTP fallback
- teams mode with participant cards (chat hidden in teams mode)
- view latest assessor feedback and score dimensions

## Recent UX + Realtime Improvements

- Added interrupt support so user speech can cut active bot audio.
- Added AI floor control in teams mode:
  - AI turn shows `Thinking...`
  - user card shows `Muted` while AI has the floor
  - speaking state appears on participant cards.
- Excluded assessor bot from visible teams participants.
- Added speech echo guard for laptop speaker usage:
  - ignores mic transcripts while bot audio is playing
  - short cooldown after playback to avoid self-trigger.
- Improved chat stability for long sessions:
  - constrained simulator layout to viewport
  - message pane is the only scrollable area
  - robust long-text/URL wrapping without overflow.

## Data / Migration

DbContext updates were made in:

- `aspnet-core/src/MosaicTalent.EntityFrameworkCore/EntityFrameworkCore/MosaicTalentDbContext.cs`

Run migration commands locally:

```bash
cd aspnet-core
dotnet ef migrations add AddSimulationScenarioFeature --project src/MosaicTalent.EntityFrameworkCore --startup-project src/MosaicTalent.Web.Host
dotnet ef database update --project src/MosaicTalent.EntityFrameworkCore --startup-project src/MosaicTalent.Web.Host
```
