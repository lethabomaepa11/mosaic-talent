# Assessment Submission Task/File Processing

## Summary

The assessment submit flow could block with:

- "Submission incomplete"
- "Respond to the collaboration scenario"

even though the page does not expose a collaboration response input.

This update removes that incorrect hard-block and ensures submission payloads carry task-scoped coding files so backend AI evaluation can process the assignee's actual task outputs.

## Frontend Changes

- Updated `frontend/src/app/assessment/[id]/page.tsx`:
  - removed mandatory collaboration-response validation on submit.
  - retained required checks for code/repo evidence and interactive questionnaire completion.
  - switched submit payload creation to a compact task/file-focused format.

- Added `frontend/src/app/assessment/[id]/submission.ts`:
  - builds per-problem payload with:
    - `problemId`, `title`, `description`, `language`
    - submitted `files` (non-empty only)
    - merged `code` snapshot
    - trimmed prompt-attempt history for scoring context
  - builds final `submissionText` without duplicating full workspace tree.

## Backend Changes

- Updated `aspnet-core/src/MosaicTalent.Application/Services/CompanyJobService/CompanyJobAppService.cs`:
  - `ParseLeetPromptSubmission(...)` now parses:
    - per-problem `files`
    - task metadata (`title`, `description`, `language`)
    - context fallback from generated assessment problems
  - AI evaluator prompt now includes task/file evidence so scoring aligns with assigned tasks.
  - LeetPrompt summary for AI now includes task labels, file hints, and test progress.

## Testing

- Added frontend unit tests:
  - `frontend/src/app/assessment/[id]/__tests__/submission.test.ts`
  - covers code-detection, task/file payload shaping, and compact submission JSON behavior.
