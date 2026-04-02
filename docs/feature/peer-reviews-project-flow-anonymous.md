# Peer Reviews Project Flow + Anonymous Reviews

## Summary

Restructured peer reviews into a project-first flow and enforced anonymous presentation.

## UX Changes

- `/app/reviews` now shows project cards with review workload counts:
  - pending reviews
  - completed reviews
  - received reviews
- Clicking a project opens `/app/reviews/[projectId]` to complete reviews.
- Project review page contains:
  - rating + question answers for assigned reviews
  - anonymous feedback received section
  - project AI feedback summary

## Anonymity Changes

- Reviewer/reviewee display names are now returned as anonymous labels.
- Peer review question text is sanitized to remove known teammate names.
- New generated fallback review questions use anonymous teammate wording.

## Files

- `frontend/src/app/app/(developer)/reviews/page.tsx`
- `frontend/src/app/app/(developer)/reviews/style.ts`
- `frontend/src/app/app/(developer)/reviews/reviewProjectSummary.ts`
- `frontend/src/app/app/(developer)/reviews/__tests__/reviewProjectSummary.test.ts`
- `frontend/src/app/app/(developer)/reviews/[project]/page.tsx`
- `frontend/src/app/app/(developer)/reviews/[project]/style.ts`
- `aspnet-core/src/MosaicTalent.Application/Services/PeerReviewService/PeerReviewAppService.cs`
- `aspnet-core/src/MosaicTalent.Application/Services/PeerReviewService/PeerReviewGenerationService.cs`
