# AI Peer Reviews

This feature generates AI-assisted peer review workflows after a project is completed.

## Scope

- Backend entities and app services for peer reviews, questions, answers, and project-level feedback
- Automatic generation on project completion
- Frontend provider and `/app/reviews` page for rating + answering

## Backend Models

Implemented in `aspnet-core/src/MosaicTalent.Core/Domains/Reviews`:

- `PeerReview`
  - `ProjectId`
  - `ReviewerDeveloperId`
  - `RevieweeDeveloperId`
  - `Rating` (1-10)
- `AIReviewQuestion`
  - `PeerReviewId`
  - `Text`
  - `Type`
  - `RelatedGoal`
  - `Category`
- `ReviewAnswer`
  - `AIReviewQuestionId`
  - `Text`
- `AIReviewFeedback`
  - `ProjectId`
  - `Summary`
  - `StrengthsJson`
  - `ImprovementAreasJson`
  - `TipsJson`
  - `GrowthScore` (0-100)

DbSets and indexes are registered in:

- `aspnet-core/src/MosaicTalent.EntityFrameworkCore/EntityFrameworkCore/MosaicTalentDbContext.cs`

## Backend Services

### Generation service

- `IPeerReviewGenerationService`
- `PeerReviewGenerationService`

Responsibilities:

- generate pairwise reviewer->reviewee records for completed projects
- generate 3 AI review questions per review (Groq + fallback)
- generate one project-level AI feedback record (Groq + fallback)

### App service

- `IPeerReviewAppService`
- `PeerReviewAppService`

Endpoints:

- `GET /api/services/app/PeerReview/GetMyProjectPeerReviews`
- `GET /api/services/app/PeerReview/GetProjectPeerReviews`
- `POST /api/services/app/PeerReview/GenerateProjectPeerReviews`
- `POST /api/services/app/PeerReview/SetPeerReviewRating`
- `POST /api/services/app/PeerReview/SubmitReviewAnswer`

Rules enforced:

- only project members can view project reviews
- only the assigned reviewer can set rating or submit answers

## Project Completion Hook

`DeveloperProjectAppService.CompleteProject` now calls:

- `PeerReviewGenerationService.EnsureGeneratedForProject(projectId, tenantId)`

This ensures completed projects are immediately review-ready.

## Frontend Integration

Provider:

- `frontend/src/providers/review-provider/context.tsx`
- `frontend/src/providers/review-provider/actions.tsx`
- `frontend/src/providers/review-provider/reducer.tsx`
- `frontend/src/providers/review-provider/index.tsx`

Route:

- `frontend/src/app/app/reviews/page.tsx`
- `frontend/src/app/app/reviews/style.ts`

Behavior:

- list completed projects with available reviews
- highlight the currently selected project in the project list
- show reviews assigned to current user
- set teammate rating (1-10)
- answer generated AI questions
- show project-level AI feedback and growth score
- show loading states for slow backend operations:
  - fetching selected project reviews
  - generating AI peer reviews
  - saving rating changes
  - saving question answers

## Notes

- if Groq is unavailable, generation still works using deterministic fallback content
- API responses remain ABP-style (`result` envelope) and provider handles normalization
