# Company Jobs and Applications

This feature introduces tenant-scoped company job postings and developer applications.

## Domain Models

Implemented in `aspnet-core/src/MosaicTalent.Core/Domains/Companies`:

- `Job`
  - `CompanyId`
  - `Title`
  - `Description`
  - `Location`
  - `EmploymentType` (`FullTime`, `PartTime`, `Contract`)
  - `IsOpen`
  - `ContractDuration` (months, optional)
  - `TechnicalAssessmentPrompt`
  - `BehaviouralAssessmentPrompt`
- `JobApplication`
  - `JobId`
  - `CandidateDeveloperId`
  - `ResumeStoredFileId`
  - `MatchScore` (0-100)
  - `MatchReason`
  - `Source` (`LinkedIn`, `Facebook`, `Referral`, `Website`, `Google`, `Other`)
  - `Status` (`Applied`, `Shortlisted`, `Interview`, `Rejected`, `Approved`)

## Backend Service

- `CompanyJobAppService`
- `ICompanyJobAppService`

Endpoints:

- `GET /api/services/app/CompanyJob/GetMyJobs`
- `GET /api/services/app/CompanyJob/GetJob`
- `POST /api/services/app/CompanyJob/CreateJob`
- `PUT /api/services/app/CompanyJob/UpdateJob`
- `PUT /api/services/app/CompanyJob/ToggleJobOpenStatus`
- `GET /api/services/app/CompanyJob/GetJobApplications`
- `POST /api/services/app/CompanyJob/ApplyToJob`
- `PUT /api/services/app/CompanyJob/UpdateJobApplicationStatus`

Authorization behavior:

- company employees can view company jobs
- only company admins can create/update/toggle jobs and change application status
- developers can apply to open jobs once per job
- non-employees can only view their own applications in `GetJobApplications`

## Frontend

Provider:

- `frontend/src/providers/job-provider/context.tsx`
- `frontend/src/providers/job-provider/actions.tsx`
- `frontend/src/providers/job-provider/reducer.tsx`
- `frontend/src/providers/job-provider/index.tsx`

Route:

- `frontend/src/app/app/jobs/page.tsx`
- `frontend/src/app/app/jobs/style.ts`

UI capabilities:

- company-only jobs page under `/app/jobs`
- create/edit job postings
- open/close jobs
- view job applications
- update application status

## Data Layer

DbContext and migration updates:

- `aspnet-core/src/MosaicTalent.EntityFrameworkCore/EntityFrameworkCore/MosaicTalentDbContext.cs`
- `aspnet-core/src/MosaicTalent.EntityFrameworkCore/Migrations/20260327120857_AddCompanyJobsAndApplications.cs`
