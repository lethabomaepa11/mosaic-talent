# AI App Operator

## Summary

MosaicTalent now includes an embedded **AI App Operator** that executes natural-language commands across the authenticated app shell.

The operator is not only a chat box. It is execution-oriented:

- parses commands into intents
- navigates between routes
- clicks UI actions
- fills known form fields
- requests missing required fields only when needed
- requires confirmation for risky actions
- narrates success/failure steps in plain language

## Architecture

### 1) Provider Layer

New provider: `frontend/src/providers/app-operator-provider/`

- stores command history
- tracks pending/running/error states
- holds pending confirmations for risky actions
- calls backend AI planner via provider action (never from component)

### 2) App Registries

New registry modules in `frontend/src/lib/app-operator/`:

- `routeRegistry.ts`: maps route keys to app paths
- `actionRegistry.ts`: defines AI-targetable actions and selectors
- `intentParser.ts`: converts natural language to structured intents
- `planner.ts`: Groq planning client + response normalization + deterministic fallback
- `executionEngine.ts`: executes intent steps against UI metadata
- `safety.ts`: confirmation and risk helpers

### 3) Backend AI Planner

New ABP app service: `aspnet-core/src/MosaicTalent.Application/Services/AppOperatorService/`

- endpoint: `POST /api/services/app/AppOperator/Plan`
- consumes command + current route + action/route registry metadata
- uses `IGroqChatService` for intent planning
- sanitizes model output against known routes/actions
- computes missing required fields and confirmation flags server-side

### 4) UI Surface

Global panel: `frontend/src/components/app-operator/AppOperatorPanel.tsx`

- available from the authenticated app layout
- supports command entry, execution logs, and confirm/cancel flow
- indicates when a command was planned through Groq AI

## Stable Metadata Added

AI-friendly attributes now cover the main authenticated modules:

- dashboard (`/app`)
- profile (`/app/profile`)
- projects (`/app/projects/my`, `/app/projects/open`, `/app/projects/[id]`)
- simulator (`/app/simulator`)
- peer reviews (`/app/reviews`)
- analytics reports (`/app/reports`)
- jobs + applications (`/app/jobs`, `/app/jobs/[id]`, `/app/jobs/[id]/application/[applicationId]`)
- settings index + subpages:
  - `/app/settings`
  - `/app/settings/employees`
  - `/app/settings/company-details`
  - `/app/settings/email-templates`
  - `/app/settings/page-builder`
- developer/company sidebars

Metadata keys used:

- `data-ai-page`
- `data-ai-action`
- `data-ai-field`
- `data-ai-entity`
- `data-ai-entity-id`
- `data-ai-entity-name`

## Supported Command Patterns

- navigation commands across mapped routes
- create user (employee settings flow)
- create job posting
- create project
- AI match project
- join open project
- save profile
- scan GitHub profile
- generate peer reviews
- save company details
- save email templates
- publish page builder
- ask page-builder AI
- start scenario
- contribute scenario
- end simulation
- open candidate application
- shortlist candidates with skill filter and bulk assessment move

## Voice Input

The AI Operator now includes **always-listening voice input**:

- voice listening defaults to on when speech recognition is supported
- recognized speech is processed as commands (same pipeline as typed input)
- listening auto-restarts after recognition end/errors while enabled
- user can turn voice off at any time via the operator voice toggle

## Safety and Behavior

- planning path:
  - try backend Groq planner first
  - fallback to deterministic local parser if AI is unavailable or invalid
- missing required fields return immediate follow-up prompts
- risky actions require explicit confirmation
- execution never reports success unless steps actually run
- failures are narrated with the blocked step

## Limitations

- teammate/teamwork threshold filtering still depends on current UI capabilities.
- deeply dynamic or ambiguous cross-entity commands may still require more context.

## Tests Added

- intent parser tests
- execution engine tests
- operator reducer tests
- operator panel interaction tests
