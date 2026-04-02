# AI Task Generation From Spec + Repo Analysis

## Summary

Project members can now generate tasks with AI using:

- Project specification (markdown description)
- Repository analysis/safety context
- Existing project tasks (to avoid duplicates)

Manual task generation is still available, but AI generation now has stronger context and duplicate protection.

## Behavior Changes

- `AiGenerateProjectTasks` is no longer lead-only; any project member can trigger it.
- Frontend now sends `repoAnalysisSummary` when requesting AI task generation.
- Backend prompt includes:
  - project metadata and skills
  - repo analysis summary
  - current task list
- Backend deduplicates generated tasks against:
  - existing project tasks
  - tasks generated in the same request

## API

- Endpoint: `POST /api/services/app/DeveloperProject/AiGenerateProjectTasks`
- Input DTO now includes:
  - `projectId: Guid`
  - `repoAnalysisSummary?: string` (max 8000 chars)

## Implementation Notes

- Added dedicated task-generation helper partial:
  - `aspnet-core/src/MosaicTalent.Application/Services/DeveloperProjectService/DeveloperProjectAppService.Collaboration.TaskGeneration.cs`
- Updated orchestration:
  - `aspnet-core/src/MosaicTalent.Application/Services/DeveloperProjectService/DeveloperProjectAppService.Collaboration.cs`
- Updated frontend integration:
  - `frontend/src/app/app/(developer)/projects/[id]/page.tsx`
  - `frontend/src/providers/project-provider/context.tsx`
  - `frontend/src/providers/project-provider/index.tsx`
- Added provider test coverage for payload shape and behavior:
  - `frontend/src/providers/project-provider/__tests__/ProjectProvider.test.tsx`
