# CompanyJobAppService Real Data Refactor

## Date

- March 27, 2026

## Summary

This change removes hardcoded fallback assessment content in `CompanyJobAppService` and replaces it with job/candidate-context-driven generation.

## Key Backend Changes

1. Replaced hardcoded fallback assessment content with real context:
- `BuildEndpointHints` now extracts endpoint hints from job description and prompts.
- `BuildInteractiveQuestions` now uses role and extracted skills context.
- `DefaultStarterCode` now uses job/assessment context rather than static login/auth examples.
- `BuildHeuristicAssessment` now derives extracted skills from shared job/candidate technical terms instead of a fixed skill bank.

2. Added parsing helpers for real data signals:
- `ExtractSharedTechnicalTerms`
- `TokenizeTechnicalTerms`

3. Added and wired assessment partial/service DTO files:
- `CompanyJobAppService.AssessmentGeneration.cs`
- `DTO/SaveAssessmentDraftInput.cs`

4. Removed unused generated migration files from this workstream:
- `20260327185528_AddJobAssessment23.cs`
- `20260327185528_AddJobAssessment23.Designer.cs`

## Why

The previous fallback behavior embedded static, generic data (for example login/auth starter snippets and fixed skill lists), which made generated assessments less aligned with real role and candidate context.

## Validation

- Backend build: `dotnet build src/MosaicTalent.Application/MosaicTalent.Application.csproj` passed.
- Frontend tests: `npm test` passed (`49` tests).

## Notes

- No migration commands were run.
- If schema changes are needed in future work, migration creation/update must be run manually by the user.
