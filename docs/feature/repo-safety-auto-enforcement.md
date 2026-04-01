# Repo Safety Auto-Enforcement

## Summary

Repository safety is now enforced in project workflows:

- Project creation is blocked when selected repositories are flagged as unsafe.
- Repo safety scans run automatically in project views (no manual scan button).
- Members are warned when scans detect potentially malicious findings.

## What Changed

## 1) Create-Project Safety Gate

- During project creation, the selected GitHub repository is scanned before submission.
- If the scan is unsafe, project creation is blocked and the UI shows a clear malicious-code warning.
- Backend also enforces this check in `CreateProject` so unsafe repos cannot bypass frontend validation.

## 2) New Backend Scan-by-URL Endpoint

- Added `ScanRepoSafetyByUrl` in `DeveloperProjectAppService`.
- Used by create-project flow to scan a selected repository before a project exists.

## 3) Automatic Safety Scans on Load

- Open projects page now scans linked repositories automatically on load.
- Project detail page now scans repository safety automatically on load.
- Manual repo-safety scan actions/buttons were removed.

## 4) Member Warning for New Malicious Code

- Project detail now shows a high-visibility warning when scan results indicate unsafe or malicious findings.
- This warning is visible to participants/members viewing the project.

## Safety Decision Rule

A repository is treated as unsafe when either:

- `riskLevel` is `high` or `critical`, or
- findings include high/critical severity or malicious indicators (for example: `malicious`, `backdoor`, `trojan`, `ransomware`, `credential`, `stealer`).

## Files Updated

- Backend:
  - `aspnet-core/src/MosaicTalent.Application/Services/DeveloperProjectService/DeveloperProjectAppService.cs`
  - `aspnet-core/src/MosaicTalent.Application/Services/DeveloperProjectService/IDeveloperProjectAppService.cs`
  - `aspnet-core/src/MosaicTalent.Application/Services/DeveloperProjectService/DTO/RepoSafetyScanDto.cs`
- Frontend:
  - `frontend/src/app/app/(developer)/projects/my/page.tsx`
  - `frontend/src/app/app/(developer)/projects/open/page.tsx`
  - `frontend/src/app/app/(developer)/projects/[id]/page.tsx`
  - `frontend/src/components/project-card/ProjectCard.tsx`
  - `frontend/src/providers/project-provider/context.tsx`
  - `frontend/src/providers/project-provider/index.tsx`
  - `frontend/src/providers/project-provider/__tests__/ProjectProvider.test.tsx`
  - `frontend/src/utils/repoSafety.ts`
  - `frontend/src/utils/__tests__/repoSafety.test.ts`
