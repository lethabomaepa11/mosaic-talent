# AI Matching Documentation

This document explains how project matching works for developers.

## Scope

Implemented in:

- `aspnet-core/src/MosaicTalent.Application/Services/DeveloperProjectService/DeveloperProjectAppService.cs`
- `frontend/src/providers/project-provider/*`
- `frontend/src/app/app/projects/my/page.tsx`
- `frontend/src/app/app/projects/[id]/page.tsx`

## Endpoints

- `GET /api/services/app/DeveloperProject/GetOpenProjects`
- `POST /api/services/app/DeveloperProject/AiMatchProject`

## Open Projects Behavior

`GetOpenProjects` now:

- returns all projects with status `Open` (no owner/member/full filtering)
- sorts by descending match relevance for current developer
- includes `matchScore` per project (0-100)

## Match Score (0-100)

`matchScore` is computed from:

- skill alignment (highest weight)
- goal relevance from project title/description/skills
- team availability (open member slots)

Enhancements added:

- skill aliases: `js`/`javascript`, `ts`/`typescript`, `node`/`node.js`/`nodejs`, `postgres`/`postgresql`, `c#`/`.net`/`asp.net`/`dotnet`
- partial matching support for near-equivalent tokens
- friendly score scaling to avoid tiny values for viable matches

## AI Match Flow

When a user clicks **AI Match Me**:

1. Frontend calls `AiMatchProject`.
2. Backend gets sorted open projects and user profile (skills + goals).
3. If Groq is configured, backend asks Groq to choose best project and provide:
   - `projectId`
   - `matchInsight`
   - `learningOutcomes`
4. If Groq is unavailable/fails, deterministic fallback chooses top match and builds insight/learning outcomes locally.
5. Frontend redirects to `/app/projects/[id]?from=ai-match`.
6. Project page shows:
   - why the project is a great match
   - what the user will likely learn

## Response Fields

`DeveloperProjectDto` includes:

- `matchScore: int`
- `matchInsight: string`
- `learningOutcomes: string[]`

These are consumed by project cards and project detail pages.

## Configuration

Set backend config for Groq:

- `Groq:ApiKey`
- `Groq:Model` (default: `llama-3.3-70b-versatile`)

If `ApiKey` is missing, matching still works via deterministic fallback logic.
