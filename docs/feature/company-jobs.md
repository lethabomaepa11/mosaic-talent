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
  - `Status` (`Applied`, `Shortlisted`, `Assessment`, `Interview`, `Rejected`, `Approved`)

## Backend Service

- `CompanyJobAppService`
- `ICompanyJobAppService`

Endpoints:

- `GET /api/services/app/CompanyJob/GetOpenJobs` (anonymous, tenant-scoped)
- `GET /api/services/app/CompanyJob/GetMyJobs`
- `GET /api/services/app/CompanyJob/GetJob`
- `POST /api/services/app/CompanyJob/CreateJob`
- `PUT /api/services/app/CompanyJob/UpdateJob`
- `PUT /api/services/app/CompanyJob/ToggleJobOpenStatus`
- `GET /api/services/app/CompanyJob/GetJobApplications`
- `GET /api/services/app/CompanyJob/GetCandidatesDirectory` (company employees, tenant-1 shared pool)
- `POST /api/services/app/CompanyJob/ApplyToJob`
- `POST /api/services/app/CompanyJob/ApplyToPublicJob` (anonymous form apply)
- `GET /api/services/app/CompanyJob/GetPublicJobsPage`
- `GET /api/services/app/CompanyJob/GetMyJobsPageSettings`
- `PUT /api/services/app/CompanyJob/UpdateMyJobsPageSettings`
- `POST /api/services/app/CompanyJob/GenerateMyJobsPageSettingsWithAi`
- `PUT /api/services/app/CompanyJob/UpdateJobApplicationStatus`
- `POST /api/services/app/CompanyJob/BulkMoveApplicationsToAssessment`

Authorization behavior:

- anyone can browse open jobs for the current tenant via `GetOpenJobs`
- anyone can submit applications via `ApplyToPublicJob` (no login required)
- company employees can view company jobs
- only company admins can create/update/toggle jobs and change application status
- developers can apply to open jobs once per job
- non-employees can only view their own applications in `GetJobApplications`
- every company tenant can access a shared candidate directory sourced from tenant `1`

## Frontend

Provider:

- `frontend/src/providers/job-provider/context.tsx`
- `frontend/src/providers/job-provider/actions.tsx`
- `frontend/src/providers/job-provider/reducer.tsx`
- `frontend/src/providers/job-provider/index.tsx`

Route:

- `frontend/src/app/app/jobs/page.tsx`
- `frontend/src/app/app/jobs/style.ts`
- `frontend/src/app/app/jobs/[id]/page.tsx`
- `frontend/src/app/app/jobs/[id]/style.ts`
- `frontend/src/app/app/jobs/[id]/application/[applicationId]/page.tsx`
- `frontend/src/app/app/jobs/[id]/application/[applicationId]/style.ts`
- `frontend/src/app/jobs/page.tsx`
- `frontend/src/app/jobs/style.ts`
- `frontend/src/app/app/settings/page-builder/page.tsx`
- `frontend/src/app/app/settings/page-builder/style.ts`

UI capabilities:

- company-only jobs page under `/app/jobs`
- create/edit job postings
- open/close jobs
- view job applications per job under `/app/jobs/[id]`
- view full application detail under `/app/jobs/[id]/application/[applicationId]`
- browse tenant-scoped open jobs publicly under `/jobs`
- apply from `/jobs` with a dynamic anonymous form
- anonymous resume upload via `POST /api/files/upload-public` (no login required, PDF-only for resumes)
- AI-assisted public application scoring:
  - CV text extraction (PDF resumes)
  - extracted skills + GitHub repo discovery
  - fit score (0-100), strengths, weaknesses, and verdict
  - persisted into application payload and surfaced in HR applications view
- branded applicant confirmation emails:
  - shared wrapper with Mosaic Talent logo (`https://mosaic-talent.vercel.app/text-logo.svg`)
  - color scheme from company jobs-page primary color
  - configurable email type `applicationReceived` in settings/page-builder
  - mode can be `manual` (HR template) or `ai` (AI-generated body)
  - requires valid Brevo sender config (`Brevo:SenderEmail`, optional `Brevo:SenderName`)
- view shared tenant-1 candidate directory inside `/app/jobs/[id]`
- update application status
- bulk move candidates to assessment based on criteria + send assessment invite emails
- company page-builder in `/app/settings/page-builder`:
  - drag/drop-like block composition (hero, text, image, button, form, jobs list)
  - value editing panel + image upload
  - AI assistant prompt that generates page settings
  - edit/preview toggle
  - persisted layout + form schema in DB
- settings hub in `/app/settings` with dedicated pages:
  - `/app/settings/company-details` for company profile/logo/contact updates
  - `/app/settings/page-builder` for public jobs page design
  - `/app/settings/email-templates` for applicant email template management

## Data Layer

DbContext and migration updates:

- `aspnet-core/src/MosaicTalent.EntityFrameworkCore/EntityFrameworkCore/MosaicTalentDbContext.cs`
- `aspnet-core/src/MosaicTalent.EntityFrameworkCore/Migrations/20260327120857_AddCompanyJobsAndApplications.cs`
