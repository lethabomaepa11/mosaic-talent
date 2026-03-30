using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Notifications;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Companies;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Services.AiService;
using MosaicTalent.Services.CompanyJobService.DTO;
using MosaicTalent.Services.NotificationChannelService;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Xml.Linq;
using Abp;
using UglyToad.PdfPig;

namespace MosaicTalent.Services.CompanyJobService;

[AbpAuthorize]
public partial class CompanyJobAppService : MosaicTalentAppServiceBase, ICompanyJobAppService
{
    private readonly IRepository<Company, Guid> _companyRepository;
    private readonly IRepository<CompanyEmployee, Guid> _companyEmployeeRepository;
    private readonly IRepository<Job, Guid> _jobRepository;
    private readonly IRepository<JobApplication, Guid> _jobApplicationRepository;
    private readonly IRepository<PublicJobApplication, Guid> _publicJobApplicationRepository;
    private readonly IRepository<JobAssessment, Guid> _jobAssessmentRepository;
    private readonly IRepository<CompanyJobsPageSettings, Guid> _jobsPageSettingsRepository;
    private readonly IRepository<Developer, Guid> _developerRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly IGroqChatService _groqChatService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly INotificationEventDispatcher _notificationEventDispatcher;

    public CompanyJobAppService(
        IRepository<Company, Guid> companyRepository,
        IRepository<CompanyEmployee, Guid> companyEmployeeRepository,
        IRepository<Job, Guid> jobRepository,
        IRepository<JobApplication, Guid> jobApplicationRepository,
        IRepository<PublicJobApplication, Guid> publicJobApplicationRepository,
        IRepository<JobAssessment, Guid> jobAssessmentRepository,
        IRepository<CompanyJobsPageSettings, Guid> jobsPageSettingsRepository,
        IRepository<Developer, Guid> developerRepository,
        IRepository<User, long> userRepository,
        IGroqChatService groqChatService,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        IHttpContextAccessor httpContextAccessor,
        INotificationEventDispatcher notificationEventDispatcher)
    {
        _companyRepository = companyRepository;
        _companyEmployeeRepository = companyEmployeeRepository;
        _jobRepository = jobRepository;
        _jobApplicationRepository = jobApplicationRepository;
        _publicJobApplicationRepository = publicJobApplicationRepository;
        _jobAssessmentRepository = jobAssessmentRepository;
        _jobsPageSettingsRepository = jobsPageSettingsRepository;
        _developerRepository = developerRepository;
        _userRepository = userRepository;
        _groqChatService = groqChatService;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _httpContextAccessor = httpContextAccessor;
        _notificationEventDispatcher = notificationEventDispatcher;
    }

    [AbpAllowAnonymous]
    public async Task<PublicJobsPageDto> GetPublicJobsPage()
    {
        var tenantId = AbpSession.TenantId;
        if (!tenantId.HasValue)
        {
            throw new UserFriendlyException("Tenant context is required.");
        }

        var company = await GetCompanyByTenant(tenantId.Value);
        var settings = await TryGetPageSettingsOrNull(tenantId.Value, company.Id);

        return MapPublicJobsPage(company, settings);
    }

    public async Task<List<JobDto>> GetMyJobs()
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var company = await GetCompanyByTenant(tenantId);
        await EnsureCompanyEmployee(company.Id);

        var jobs = await _jobRepository.GetAll()
            .Where(x => x.TenantId == tenantId && x.CompanyId == company.Id)
            .OrderByDescending(x => x.CreationTime)
            .ToListAsync();

        return await MapJobs(jobs);
    }

    [AbpAllowAnonymous]
    public async Task<List<JobDto>> GetOpenJobs()
    {
        var tenantId = AbpSession.TenantId;
        if (!tenantId.HasValue)
        {
            return new List<JobDto>();
        }

        var jobs = await _jobRepository.GetAll()
            .Where(x => x.TenantId == tenantId.Value && x.IsOpen)
            .OrderByDescending(x => x.CreationTime)
            .ToListAsync();

        return await MapJobs(jobs);
    }

    public async Task<JobDto> GetJob(GetJobInput input)
    {
        var job = await _jobRepository.FirstOrDefaultAsync(input.JobId)
            ?? throw new UserFriendlyException("Job not found.");
        await EnsureJobVisible(job);

        var mapped = await MapJobs(new List<Job> { job });
        return mapped.First();
    }

    public async Task<JobDto> CreateJob(CreateJobInput input)
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var company = await GetCompanyByTenant(tenantId);
        await EnsureCompanyAdmin(company.Id);

        var employmentType = ParseEmploymentType(input.EmploymentType);
        if (employmentType == EmploymentType.Contract && (!input.ContractDuration.HasValue || input.ContractDuration.Value <= 0))
        {
            throw new UserFriendlyException("Contract jobs require contract duration in months.");
        }

        var job = new Job
        {
            TenantId = tenantId,
            CompanyId = company.Id,
            Title = input.Title.Trim(),
            Description = input.Description.Trim(),
            Location = input.Location.Trim(),
            EmploymentType = employmentType,
            IsOpen = input.IsOpen,
            ContractDuration = employmentType == EmploymentType.Contract ? input.ContractDuration : null,
            TechnicalAssessmentPrompt = input.TechnicalAssessmentPrompt?.Trim(),
            BehaviouralAssessmentPrompt = input.BehaviouralAssessmentPrompt?.Trim(),
        };

        await _jobRepository.InsertAsync(job);
        await CurrentUnitOfWork.SaveChangesAsync();

        var mapped = await MapJobs(new List<Job> { job });
        return mapped.First();
    }

    public async Task<JobDto> UpdateJob(UpdateJobInput input)
    {
        var job = await _jobRepository.FirstOrDefaultAsync(input.JobId)
            ?? throw new UserFriendlyException("Job not found.");
        await EnsureJobAdmin(job);

        var employmentType = ParseEmploymentType(input.EmploymentType);
        if (employmentType == EmploymentType.Contract && (!input.ContractDuration.HasValue || input.ContractDuration.Value <= 0))
        {
            throw new UserFriendlyException("Contract jobs require contract duration in months.");
        }

        job.Title = input.Title.Trim();
        job.Description = input.Description.Trim();
        job.Location = input.Location.Trim();
        job.EmploymentType = employmentType;
        job.IsOpen = input.IsOpen;
        job.ContractDuration = employmentType == EmploymentType.Contract ? input.ContractDuration : null;
        job.TechnicalAssessmentPrompt = input.TechnicalAssessmentPrompt?.Trim();
        job.BehaviouralAssessmentPrompt = input.BehaviouralAssessmentPrompt?.Trim();

        await _jobRepository.UpdateAsync(job);
        await CurrentUnitOfWork.SaveChangesAsync();

        var mapped = await MapJobs(new List<Job> { job });
        return mapped.First();
    }

    public async Task<JobDto> ToggleJobOpenStatus(ToggleJobOpenStatusInput input)
    {
        var job = await _jobRepository.FirstOrDefaultAsync(input.JobId)
            ?? throw new UserFriendlyException("Job not found.");
        await EnsureJobAdmin(job);

        job.IsOpen = input.IsOpen;
        await _jobRepository.UpdateAsync(job);
        await CurrentUnitOfWork.SaveChangesAsync();

        var mapped = await MapJobs(new List<Job> { job });
        return mapped.First();
    }

    public async Task<List<JobApplicationDto>> GetJobApplications(GetJobInput input)
    {
        var job = await _jobRepository.FirstOrDefaultAsync(input.JobId)
            ?? throw new UserFriendlyException("Job not found.");
        await EnsureJobVisible(job);

        var isCompanyEmployee = await IsCurrentUserCompanyEmployee(job.CompanyId);
        var currentDeveloper = await GetCurrentDeveloperOrNull();
        var myDeveloperId = currentDeveloper?.Id;

        var memberQuery = _jobApplicationRepository.GetAll()
            .Where(x => x.JobId == job.Id);
        var publicQuery = _publicJobApplicationRepository.GetAll()
            .Where(x => x.JobId == job.Id);

        if (!isCompanyEmployee)
        {
            if (myDeveloperId == null)
            {
                throw new UserFriendlyException("You are not authorized to view these applications.");
            }

            memberQuery = memberQuery.Where(x => x.CandidateDeveloperId == myDeveloperId.Value);
            publicQuery = publicQuery.Where(x => x.CandidateDeveloperId == myDeveloperId.Value);
        }

        var memberApplications = await memberQuery.ToListAsync();
        List<PublicJobApplication> publicApplications;
        try
        {
            publicApplications = await publicQuery.ToListAsync();
        }
        catch (Exception ex) when (IsMissingRelation(ex))
        {
            publicApplications = new List<PublicJobApplication>();
        }
        var mappedMember = await MapApplications(memberApplications);
        var mappedPublic = await MapPublicApplications(publicApplications);

        return mappedMember
            .Concat(mappedPublic)
            .OrderByDescending(x => x.CreatedAt)
            .ToList();
    }

    [AbpAuthorize]
    public async Task<List<JobCandidateDto>> GetCandidatesDirectory()
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var company = await GetCompanyByTenant(tenantId);
        await EnsureCompanyEmployee(company.Id);

        using (CurrentUnitOfWork.DisableFilter(AbpDataFilters.MayHaveTenant, AbpDataFilters.MustHaveTenant))
        {
            var tenantOneUserIds = await _userRepository.GetAll()
                .Where(x => x.TenantId == 1)
                .Select(x => x.Id)
                .ToListAsync();

            var developers = await _developerRepository.GetAll()
                .Where(x => tenantOneUserIds.Contains(x.UserId))
                .OrderByDescending(x => x.CreationTime)
                .ToListAsync();

            var users = await _userRepository.GetAll()
                .Where(x => tenantOneUserIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => x);

            return developers.Select(developer =>
            {
                users.TryGetValue(developer.UserId, out var user);
                var fullName = string.Join(" ", new[] { user?.Name, user?.Surname }.Where(x => !string.IsNullOrWhiteSpace(x)));
                var candidateName = string.IsNullOrWhiteSpace(fullName) ? user?.UserName ?? "Candidate" : fullName;

                return new JobCandidateDto
                {
                    DeveloperId = developer.Id,
                    UserId = developer.UserId,
                    FullName = candidateName,
                    Email = user?.EmailAddress ?? string.Empty,
                    AvatarUrl = user?.AvatarUrl ?? string.Empty,
                    GithubUsername = developer.GithubUsername ?? string.Empty,
                };
            }).ToList();
        }
    }

    public async Task<JobApplicationDto> ApplyToJob(ApplyToJobInput input)
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var developer = await GetCurrentDeveloper();
        EnsurePdfResumeReference(input.ResumeStoredFileId);
        var job = await _jobRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == input.JobId && x.TenantId == tenantId)
            ?? throw new UserFriendlyException("Job not found.");

        if (!job.IsOpen)
        {
            throw new UserFriendlyException("This job is no longer accepting applications.");
        }

        var exists = await _jobApplicationRepository.GetAll()
            .AnyAsync(x => x.JobId == job.Id && x.CandidateDeveloperId == developer.Id);
        if (exists)
        {
            throw new UserFriendlyException("You already applied for this job.");
        }

        var source = ParseApplicationSource(input.Source);
        var application = new JobApplication
        {
            TenantId = tenantId,
            JobId = job.Id,
            CandidateDeveloperId = developer.Id,
            ResumeStoredFileId = input.ResumeStoredFileId?.Trim(),
            MatchScore = 0,
            MatchReason = "Pending AI evaluation.",
            Source = source,
            Status = ApplicationStatus.Applied,
        };

        await _jobApplicationRepository.InsertAsync(application);
        await CurrentUnitOfWork.SaveChangesAsync();

        try
        {
            var recipient = await ResolveMemberApplicationRecipientAsync(application);
            var candidateName = string.IsNullOrWhiteSpace(recipient.Name) ? "A candidate" : recipient.Name;
            await NotifyCompanyAboutNewApplicationAsync(job, candidateName);
        }
        catch (Exception ex)
        {
            Logger.Warn("Failed to dispatch member application notification.", ex);
        }

        try
        {
            var recipient = await ResolveMemberApplicationRecipientAsync(application);
            await CreateAssessmentRecordAsync(
                job,
                recipient.Name,
                recipient.Email,
                application.Id,
                null,
                new ApplicationAssessment
                {
                    Score = application.MatchScore,
                    Summary = application.MatchReason ?? string.Empty,
                    Verdict = "Pending assessment",
                    Strengths = new List<string>(),
                    Weaknesses = new List<string>(),
                },
                string.Empty);
            await CurrentUnitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Logger.Warn("Member assessment creation failed.", ex);
        }

        var mapped = await MapApplications(new List<JobApplication> { application });
        return mapped.First();
    }

    [AbpAllowAnonymous]
    public async Task<JobApplicationDto> ApplyToPublicJob(ApplyToPublicJobInput input)
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        EnsurePdfResumeReference(input.ResumeStoredFileId);
        var job = await _jobRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == input.JobId && x.TenantId == tenantId)
            ?? throw new UserFriendlyException("Job not found.");

        if (!job.IsOpen)
        {
            throw new UserFriendlyException("This job is no longer accepting applications.");
        }

        var developer = await GetCurrentDeveloperOrNull();
        var source = ParseApplicationSource(input.Source);
        var resumeText = await TryExtractResumeTextAsync(input.ResumeStoredFileId);
        var aiAssessment = await BuildApplicationAssessmentAsync(job, input, resumeText);
        var mergedResponseJson = MergeResponsesWithAssessment(input.ResponsesJson, aiAssessment, resumeText);
        var publicApplication = new PublicJobApplication
        {
            TenantId = tenantId,
            JobId = job.Id,
            CandidateDeveloperId = developer?.Id,
            FullName = input.FullName.Trim(),
            Email = input.Email.Trim().ToLowerInvariant(),
            PhoneNumber = input.PhoneNumber?.Trim(),
            ResumeStoredFileId = input.ResumeStoredFileId?.Trim(),
            TechnicalAssessmentAnswer = input.TechnicalAssessmentAnswer?.Trim(),
            BehaviouralAssessmentAnswer = input.BehaviouralAssessmentAnswer?.Trim(),
            ApplicationResponseJson = mergedResponseJson,
            Source = source,
            MatchScore = aiAssessment.Score,
            MatchReason = aiAssessment.Summary,
            Status = ApplicationStatus.Applied,
        };

        try
        {
            await _publicJobApplicationRepository.InsertAsync(publicApplication);
            await CurrentUnitOfWork.SaveChangesAsync();
            await NotifyCompanyAboutNewApplicationAsync(job, publicApplication.FullName);
        }
        catch (Exception ex) when (IsMissingRelation(ex))
        {
            throw new UserFriendlyException("Public applications are not ready yet. Please run the latest database migrations.");
        }

        JobAssessment createdAssessment = null;
        try
        {
            createdAssessment = await CreateAssessmentRecordAsync(
                job,
                publicApplication.FullName,
                publicApplication.Email,
                null,
                publicApplication.Id,
                aiAssessment,
                resumeText);
            await CurrentUnitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Logger.Warn("Assessment creation failed.", ex);
        }

        try
        {
            var company = await GetCompanyByTenant(tenantId);
            var settings = await TryGetPageSettingsOrNull(tenantId, company.Id);
            var assessmentLink = createdAssessment == null ? string.Empty : BuildAssessmentUrl(createdAssessment.Id);
            await SendApplicationReceivedEmailAsync(company, settings, job, publicApplication, aiAssessment, assessmentLink);
        }
        catch (Exception ex)
        {
            Logger.Warn("Application received email failed.", ex);
        }

        return new JobApplicationDto
        {
            Id = publicApplication.Id,
            JobId = publicApplication.JobId,
            CandidateDeveloperId = publicApplication.CandidateDeveloperId ?? Guid.Empty,
            CandidateName = publicApplication.FullName,
            CandidateEmail = publicApplication.Email,
            ResumeStoredFileId = publicApplication.ResumeStoredFileId,
            MatchScore = publicApplication.MatchScore,
            MatchReason = publicApplication.MatchReason,
            Source = ToSourceLabel(publicApplication.Source),
            Status = ToStatusLabel(publicApplication.Status),
            CreatedAt = publicApplication.CreationTime,
            IsPublicApplication = true,
            ApplicationResponseJson = publicApplication.ApplicationResponseJson ?? string.Empty,
            AiStrengths = aiAssessment.Strengths,
            AiWeaknesses = aiAssessment.Weaknesses,
            AiVerdict = aiAssessment.Verdict,
            AiExtractedSkills = aiAssessment.ExtractedSkills,
            AiGithubRepo = aiAssessment.GithubRepo,
            AiGithubUsername = aiAssessment.GithubUsername,
            AiGithubProfileSummary = aiAssessment.GithubProfileSummary,
            AiGithubDocumentationScore = aiAssessment.DocumentationScore,
            AiGithubDocumentationNotes = aiAssessment.DocumentationNotes,
            AiGithubAnalysisConfidence = aiAssessment.AnalysisConfidence,
            AiGithubAnalysisSourceStatus = aiAssessment.AnalysisSourceStatus,
            AiProjects = ToProjectDtos(aiAssessment.Projects),
            AiMosaic = aiAssessment.Mosaic,
            AiExperienceHighlights = aiAssessment.ExperienceHighlights,
            AiTotalExperienceYears = aiAssessment.TotalExperienceYears,
            AssessmentId = createdAssessment?.Id,
            AssessmentStatus = createdAssessment == null ? string.Empty : ToAssessmentStatusLabel(createdAssessment.Status),
            AssessmentScore = createdAssessment?.Score,
            AssessmentVerdict = createdAssessment?.Verdict ?? string.Empty,
            AssessmentSubmittedAt = createdAssessment?.SubmittedAt,
        };
    }

    [AbpAllowAnonymous]
    public async Task<JobAssessmentDto> GetAssessment(GetAssessmentInput input)
    {
        var assessment = await _jobAssessmentRepository.FirstOrDefaultAsync(input.AssessmentId)
            ?? throw new UserFriendlyException("Assessment not found.");
        if (assessment.Status != AssessmentStatus.Pending)
        {
            throw new UserFriendlyException("Assessment already submitted.");
        }
        var job = await _jobRepository.FirstOrDefaultAsync(assessment.JobId)
            ?? throw new UserFriendlyException("Job not found.");
        var company = await _companyRepository.FirstOrDefaultAsync(job.CompanyId);

        var isFirstOpen = !HasAssessmentStarted(assessment.ContextJson);
        var changed = await EnsureLeetPromptProblemsAsync(job, assessment, isFirstOpen);
        if (isFirstOpen)
        {
            assessment.ContextJson = MarkAssessmentStarted(assessment.ContextJson);
            changed = true;
        }
        if (changed)
        {
            await _jobAssessmentRepository.UpdateAsync(assessment);
            await CurrentUnitOfWork.SaveChangesAsync();
        }

        return MapAssessmentDto(assessment, job, company);
    }

    [AbpAllowAnonymous]
    public async Task<RunAssessmentPromptDto> RunAssessmentPrompt(RunAssessmentPromptInput input)
    {
        var assessment = await _jobAssessmentRepository.FirstOrDefaultAsync(input.AssessmentId)
            ?? throw new UserFriendlyException("Assessment not found.");
        if (assessment.Status != AssessmentStatus.Pending)
        {
            throw new UserFriendlyException("Assessment already submitted.");
        }
        var job = await _jobRepository.FirstOrDefaultAsync(assessment.JobId)
            ?? throw new UserFriendlyException("Job not found.");

        var changed = await EnsureLeetPromptProblemsAsync(job, assessment);
        if (changed)
        {
            await _jobAssessmentRepository.UpdateAsync(assessment);
            await CurrentUnitOfWork.SaveChangesAsync();
        }

        var problems = ParseLeetPromptProblems(assessment.ContextJson);
        var problem = problems.FirstOrDefault(x => string.Equals(x.Id, input.ProblemId, StringComparison.OrdinalIgnoreCase))
            ?? throw new UserFriendlyException("Assessment problem not found.");

        var prompt = input.Prompt?.Trim() ?? string.Empty;
        if (prompt.Length < 3)
        {
            throw new UserFriendlyException("Prompt is too short.");
        }

        var completion = await TryCompleteAssessmentPromptWithUsage(job, assessment, problem, prompt);
        var proposal = BuildProposalFromPrompt(prompt, completion.Response);
        return new RunAssessmentPromptDto
        {
            ProblemId = problem.Id,
            Prompt = prompt,
            Response = completion.Response,
            PromptTokens = completion.PromptTokens,
            CompletionTokens = completion.CompletionTokens,
            TotalTokens = completion.TotalTokens,
            Proposals = new List<AssessmentProposalDto>
            {
                proposal
            },
        };
    }

    [AbpAllowAnonymous]
    public async Task<JobAssessmentDto> SubmitAssessment(SubmitAssessmentInput input)
    {
        var assessment = await _jobAssessmentRepository.FirstOrDefaultAsync(input.AssessmentId)
            ?? throw new UserFriendlyException("Assessment not found.");
        if (assessment.Status != AssessmentStatus.Pending)
        {
            throw new UserFriendlyException("Assessment already submitted.");
        }
        var job = await _jobRepository.FirstOrDefaultAsync(assessment.JobId)
            ?? throw new UserFriendlyException("Job not found.");
        var company = await _companyRepository.FirstOrDefaultAsync(job.CompanyId);

        var trimmedSubmission = (input.SubmissionText ?? string.Empty).Trim();
        if (trimmedSubmission.Length < 20)
        {
            throw new UserFriendlyException("Assessment submission is too short.");
        }

        assessment.SubmissionText = trimmedSubmission;
        assessment.SubmissionGithubRepo = input.GithubRepoUrl?.Trim();
        assessment.Status = AssessmentStatus.Submitted;
        assessment.SubmittedAt = DateTime.UtcNow;

        var evaluated = await EvaluateAssessmentSubmissionAsync(job, assessment);
        assessment.Score = evaluated.Score;
        assessment.Verdict = evaluated.Verdict;
        assessment.AssessmentResultJson = JsonSerializer.Serialize(new
        {
            score = evaluated.Score,
            verdict = evaluated.Verdict,
            summary = evaluated.Summary,
            strengths = evaluated.Strengths,
            weaknesses = evaluated.Weaknesses,
            tips = evaluated.Tips,
            testScore = evaluated.TestScore,
            promptScore = evaluated.PromptScore,
            tokenEfficiencyScore = evaluated.TokenEfficiencyScore,
            codeQualityScore = evaluated.CodeQualityScore,
        });
        assessment.Status = AssessmentStatus.Reviewed;

        await _jobAssessmentRepository.UpdateAsync(assessment);
        await ApplyAssessmentOutcomeToApplication(assessment, evaluated);
        await CurrentUnitOfWork.SaveChangesAsync();
        await PublishAssessmentCompletedNotificationAsync(job, assessment);
        await NotifyCandidateAssessmentReceivedAsync(assessment, job);

        return MapAssessmentDto(assessment, job, company, evaluated);
    }

    [AbpAllowAnonymous]
    public async Task<JobAssessmentDto> SaveAssessmentDraft(SaveAssessmentDraftInput input)
    {
        var assessment = await _jobAssessmentRepository.FirstOrDefaultAsync(input.AssessmentId)
            ?? throw new UserFriendlyException("Assessment not found.");
        if (assessment.Status != AssessmentStatus.Pending)
        {
            throw new UserFriendlyException("Assessment already submitted.");
        }
        var job = await _jobRepository.FirstOrDefaultAsync(assessment.JobId)
            ?? throw new UserFriendlyException("Job not found.");
        var company = await _companyRepository.FirstOrDefaultAsync(job.CompanyId);

        var trimmedSubmission = (input.SubmissionText ?? string.Empty).Trim();
        if (trimmedSubmission.Length < 10)
        {
            throw new UserFriendlyException("Draft is too short.");
        }

        assessment.SubmissionText = trimmedSubmission;
        assessment.SubmissionGithubRepo = input.GithubRepoUrl?.Trim();
        await _jobAssessmentRepository.UpdateAsync(assessment);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapAssessmentDto(assessment, job, company);
    }

    [AbpAuthorize]
    public async Task<PublicJobsPageDto> GetMyJobsPageSettings()
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var company = await GetCompanyByTenant(tenantId);
        await EnsureCompanyEmployee(company.Id);

        var settings = await GetOrCreatePageSettings(tenantId, company.Id);
        return MapPublicJobsPage(company, settings);
    }

    [AbpAuthorize]
    public async Task<PublicJobsPageDto> UpdateMyJobsPageSettings(UpdateMyJobsPageSettingsInput input)
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var company = await GetCompanyByTenant(tenantId);
        await EnsureCompanyAdmin(company.Id);

        var settings = await GetOrCreatePageSettings(tenantId, company.Id);
        settings.HeroTitle = input.HeroTitle?.Trim();
        settings.HeroSubtitle = input.HeroSubtitle?.Trim();
        settings.HeroImageUrl = input.HeroImageUrl?.Trim();
        settings.PrimaryColor = input.PrimaryColor?.Trim();
        settings.LayoutJson = input.LayoutJson?.Trim();
        settings.ApplicationFormJson = input.ApplicationFormJson?.Trim();
        settings.EmailTemplateSettingsJson = input.EmailTemplateSettingsJson?.Trim();

        await _jobsPageSettingsRepository.UpdateAsync(settings);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapPublicJobsPage(company, settings);
    }

    [AbpAuthorize]
    public async Task<PublicJobsPageDto> GenerateMyJobsPageSettingsWithAi(GenerateJobsPageWithAiInput input)
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var company = await GetCompanyByTenant(tenantId);
        await EnsureCompanyAdmin(company.Id);

        var settings = await GetOrCreatePageSettings(tenantId, company.Id);
        var defaultLayout = ParseLayoutOrDefault(settings.LayoutJson);
        var defaultLayoutJson = JsonSerializer.Serialize(new { components = defaultLayout });

        var systemPrompt = "You generate JSON for a company jobs page configuration. Return valid JSON only.";
        var userPrompt =
            $"Company: {company.Name}\n" +
            $"Prompt: {input.Prompt ?? string.Empty}\n" +
            "Return object keys: heroTitle, heroSubtitle, heroImageUrl, primaryColor, components (string array of hero, job-list, faq, cta, image-banner), " +
            "applicationFormFields (array of objects: key,label,type,required,placeholder).";

        var response = await _groqChatService.TryCompleteAsync(systemPrompt, userPrompt);
        if (!string.IsNullOrWhiteSpace(response))
        {
            try
            {
                using var doc = JsonDocument.Parse(response);
                var root = doc.RootElement;
                settings.HeroTitle = root.TryGetProperty("heroTitle", out var titleNode)
                    ? titleNode.GetString()
                    : settings.HeroTitle;
                settings.HeroSubtitle = root.TryGetProperty("heroSubtitle", out var subtitleNode)
                    ? subtitleNode.GetString()
                    : settings.HeroSubtitle;
                settings.HeroImageUrl = root.TryGetProperty("heroImageUrl", out var imageNode)
                    ? imageNode.GetString()
                    : settings.HeroImageUrl;
                settings.PrimaryColor = root.TryGetProperty("primaryColor", out var colorNode)
                    ? colorNode.GetString()
                    : settings.PrimaryColor;
                if (root.TryGetProperty("components", out var componentsNode) && componentsNode.ValueKind == JsonValueKind.Array)
                {
                    var components = componentsNode.EnumerateArray()
                        .Select(x => x.GetString())
                        .Where(x => !string.IsNullOrWhiteSpace(x))
                        .ToList();

                    settings.LayoutJson = JsonSerializer.Serialize(new { components });
                }

                if (root.TryGetProperty("applicationFormFields", out var formFieldsNode) && formFieldsNode.ValueKind == JsonValueKind.Array)
                {
                    settings.ApplicationFormJson = $"{{\"fields\":{formFieldsNode.GetRawText()}}}";
                }
            }
            catch
            {
                settings.LayoutJson = defaultLayoutJson;
            }
        }

        await _jobsPageSettingsRepository.UpdateAsync(settings);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapPublicJobsPage(company, settings);
    }

    public async Task<JobApplicationDto> UpdateJobApplicationStatus(UpdateJobApplicationStatusInput input)
    {
        var status = ParseApplicationStatus(input.Status);
        var application = await _jobApplicationRepository.FirstOrDefaultAsync(input.JobApplicationId);
        if (application != null)
        {
            var job = await _jobRepository.FirstOrDefaultAsync(application.JobId)
                ?? throw new UserFriendlyException("Job not found.");
            await EnsureJobAdmin(job);

            application.Status = status;
            await _jobApplicationRepository.UpdateAsync(application);
            await CurrentUnitOfWork.SaveChangesAsync();
            if (status == ApplicationStatus.Assessment)
            {
                await TrySendAssessmentInviteForMemberApplication(job, application);
            }
            try
            {
                var recipient = await ResolveMemberApplicationRecipientAsync(application);
                var userId = await ResolveMemberApplicationUserIdAsync(application);
                await NotifyCandidateStatusChangedAsync(job, userId, recipient.Name, status);
            }
            catch (Exception ex)
            {
                Logger.Warn("Failed to dispatch member application status notification.", ex);
            }

            var mapped = await MapApplications(new List<JobApplication> { application });
            return mapped.First();
        }

        PublicJobApplication publicApplication = null;
        try
        {
            publicApplication = await _publicJobApplicationRepository.FirstOrDefaultAsync(input.JobApplicationId);
        }
        catch (Exception ex) when (IsMissingRelation(ex))
        {
            publicApplication = null;
        }

        if (publicApplication != null)
        {
            var job = await _jobRepository.FirstOrDefaultAsync(publicApplication.JobId)
                ?? throw new UserFriendlyException("Job not found.");
            await EnsureJobAdmin(job);

            publicApplication.Status = status;
            await _publicJobApplicationRepository.UpdateAsync(publicApplication);
            await CurrentUnitOfWork.SaveChangesAsync();
            if (status == ApplicationStatus.Assessment)
            {
                await TrySendAssessmentInviteForPublicApplication(job, publicApplication);
            }
            try
            {
                var userId = await ResolvePublicApplicationUserIdAsync(publicApplication);
                await NotifyCandidateStatusChangedAsync(job, userId, publicApplication.FullName, status);
            }
            catch (Exception ex)
            {
                Logger.Warn("Failed to dispatch public application status notification.", ex);
            }

            var mappedPublic = await MapPublicApplications(new List<PublicJobApplication> { publicApplication });
            return mappedPublic.First();
        }

        throw new UserFriendlyException("Job application not found.");
    }

    public async Task<int> BulkMoveApplicationsToAssessment(BulkMoveApplicationsToAssessmentInput input)
    {
        var job = await _jobRepository.FirstOrDefaultAsync(input.JobId)
            ?? throw new UserFriendlyException("Job not found.");
        await EnsureJobAdmin(job);

        var statusFilter = BuildStatusFilter(input.CurrentStatuses);
        var minimumScore = Math.Max(0, Math.Min(100, input.MinimumMatchScore ?? 0));
        var updatedCount = 0;

        if (input.IncludeMemberApplications)
        {
            var memberQuery = _jobApplicationRepository.GetAll()
                .Where(x => x.JobId == input.JobId && x.MatchScore >= minimumScore);
            if (statusFilter.Count > 0)
            {
                memberQuery = memberQuery.Where(x => statusFilter.Contains(x.Status));
            }

            var memberApplications = await memberQuery.ToListAsync();
            foreach (var app in memberApplications)
            {
                if (app.Status == ApplicationStatus.Assessment)
                {
                    continue;
                }

                app.Status = ApplicationStatus.Assessment;
                await _jobApplicationRepository.UpdateAsync(app);
                updatedCount++;
                await TrySendAssessmentInviteForMemberApplication(job, app);
                try
                {
                    var recipient = await ResolveMemberApplicationRecipientAsync(app);
                    var userId = await ResolveMemberApplicationUserIdAsync(app);
                    await NotifyCandidateStatusChangedAsync(job, userId, recipient.Name, ApplicationStatus.Assessment);
                }
                catch (Exception ex)
                {
                    Logger.Warn("Failed to dispatch bulk member assessment notification.", ex);
                }
            }
        }

        if (input.IncludePublicApplications)
        {
            try
            {
                var publicQuery = _publicJobApplicationRepository.GetAll()
                    .Where(x => x.JobId == input.JobId && x.MatchScore >= minimumScore);
                if (statusFilter.Count > 0)
                {
                    publicQuery = publicQuery.Where(x => statusFilter.Contains(x.Status));
                }

                var publicApplications = await publicQuery.ToListAsync();
                foreach (var app in publicApplications)
                {
                    if (app.Status == ApplicationStatus.Assessment)
                    {
                        continue;
                    }

                    app.Status = ApplicationStatus.Assessment;
                    await _publicJobApplicationRepository.UpdateAsync(app);
                    updatedCount++;
                    await TrySendAssessmentInviteForPublicApplication(job, app);
                    try
                    {
                        var userId = await ResolvePublicApplicationUserIdAsync(app);
                        await NotifyCandidateStatusChangedAsync(job, userId, app.FullName, ApplicationStatus.Assessment);
                    }
                    catch (Exception ex)
                    {
                        Logger.Warn("Failed to dispatch bulk public assessment notification.", ex);
                    }
                }
            }
            catch (Exception ex) when (IsMissingRelation(ex))
            {
                // no-op for environments without the public applications table.
            }
        }

        await CurrentUnitOfWork.SaveChangesAsync();
        return updatedCount;
    }

    private async Task<List<JobDto>> MapJobs(List<Job> jobs)
    {
        if (jobs.Count == 0)
        {
            return new List<JobDto>();
        }

        var jobIds = jobs.Select(x => x.Id).ToList();
        var companyIds = jobs.Select(x => x.CompanyId).Distinct().ToList();
        var companies = await _companyRepository.GetAll()
            .Where(x => companyIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x);
        var applicationCounts = await _jobApplicationRepository.GetAll()
            .Where(x => jobIds.Contains(x.JobId))
            .GroupBy(x => x.JobId)
            .Select(group => new
            {
                JobId = group.Key,
                Count = group.Count(),
            })
            .ToDictionaryAsync(x => x.JobId, x => x.Count);
        Dictionary<Guid, int> publicApplicationCounts;
        try
        {
            publicApplicationCounts = await _publicJobApplicationRepository.GetAll()
                .Where(x => jobIds.Contains(x.JobId))
                .GroupBy(x => x.JobId)
                .Select(group => new
                {
                    JobId = group.Key,
                    Count = group.Count(),
                })
                .ToDictionaryAsync(x => x.JobId, x => x.Count);
        }
        catch (Exception ex) when (IsMissingRelation(ex))
        {
            publicApplicationCounts = new Dictionary<Guid, int>();
        }

        return jobs.Select(job => new JobDto
        {
            Id = job.Id,
            CompanyId = job.CompanyId,
            CompanyName = companies.TryGetValue(job.CompanyId, out var company) ? company.Name : string.Empty,
            CompanyLogoStoredFileId = companies.TryGetValue(job.CompanyId, out var logoCompany) ? logoCompany.LogoStoredFileId : string.Empty,
            Title = job.Title,
            Description = job.Description,
            Location = job.Location,
            EmploymentType = ToEmploymentTypeLabel(job.EmploymentType),
            IsOpen = job.IsOpen,
            ContractDuration = job.ContractDuration,
            TechnicalAssessmentPrompt = job.TechnicalAssessmentPrompt,
            BehaviouralAssessmentPrompt = job.BehaviouralAssessmentPrompt,
            CreatedAt = job.CreationTime,
            ApplicationCount =
                (applicationCounts.TryGetValue(job.Id, out var count) ? count : 0) +
                (publicApplicationCounts.TryGetValue(job.Id, out var publicCount) ? publicCount : 0),
        }).ToList();
    }

    private async Task<List<JobApplicationDto>> MapApplications(List<JobApplication> applications)
    {
        if (applications.Count == 0)
        {
            return new List<JobApplicationDto>();
        }

        var applicationIds = applications.Select(x => x.Id).ToList();
        List<JobAssessment> assessments;
        try
        {
            assessments = await _jobAssessmentRepository.GetAll()
                .Where(x => x.JobApplicationId.HasValue && applicationIds.Contains(x.JobApplicationId.Value))
                .ToListAsync();
        }
        catch (Exception ex) when (IsMissingRelation(ex))
        {
            assessments = new List<JobAssessment>();
        }
        var assessmentsByMemberApplicationId = assessments
            .Where(x => x.JobApplicationId.HasValue)
            .GroupBy(x => x.JobApplicationId!.Value)
            .ToDictionary(x => x.Key, x => x.OrderByDescending(y => y.LastModificationTime ?? y.CreationTime).First());

        var candidateIds = applications.Select(x => x.CandidateDeveloperId).Distinct().ToList();
        List<Developer> developers;
        Dictionary<long, User> users;
        using (CurrentUnitOfWork.DisableFilter(AbpDataFilters.MayHaveTenant, AbpDataFilters.MustHaveTenant))
        {
            developers = await _developerRepository.GetAll()
                .Where(x => candidateIds.Contains(x.Id))
                .ToListAsync();
            var userIds = developers.Select(x => x.UserId).Distinct().ToList();
            users = await _userRepository.GetAll()
                .Where(x => userIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => x);
        }

        return applications.Select(application =>
        {
            var developer = developers.FirstOrDefault(x => x.Id == application.CandidateDeveloperId);
            users.TryGetValue(developer?.UserId ?? 0, out var user);
            var fullName = string.Join(" ", new[] { user?.Name, user?.Surname }.Where(x => !string.IsNullOrWhiteSpace(x)));
            var candidateName = string.IsNullOrWhiteSpace(fullName) ? user?.UserName ?? "Candidate" : fullName;
            assessmentsByMemberApplicationId.TryGetValue(application.Id, out var linkedAssessment);

            return new JobApplicationDto
            {
                Id = application.Id,
                JobId = application.JobId,
                CandidateDeveloperId = application.CandidateDeveloperId,
                CandidateName = candidateName,
                CandidateEmail = user?.EmailAddress ?? string.Empty,
                ResumeStoredFileId = application.ResumeStoredFileId,
                MatchScore = application.MatchScore,
                MatchReason = application.MatchReason,
                Source = ToSourceLabel(application.Source),
                Status = ToStatusLabel(application.Status),
                CreatedAt = application.CreationTime,
                IsPublicApplication = false,
                ApplicationResponseJson = string.Empty,
                AiStrengths = new List<string>(),
                AiWeaknesses = new List<string>(),
                AiVerdict = string.Empty,
                AiExtractedSkills = new List<string>(),
                AiGithubRepo = string.Empty,
                AiGithubUsername = string.Empty,
                AiGithubProfileSummary = string.Empty,
                AiGithubDocumentationScore = null,
                AiGithubDocumentationNotes = new List<string>(),
                AiGithubAnalysisConfidence = string.Empty,
                AiGithubAnalysisSourceStatus = new Dictionary<string, string>(),
                AiProjects = new List<AiProjectDto>(),
                AiMosaic = new Dictionary<string, double>(),
                AiExperienceHighlights = new List<string>(),
                AiTotalExperienceYears = null,
                AssessmentId = linkedAssessment?.Id,
                AssessmentStatus = linkedAssessment == null ? string.Empty : ToAssessmentStatusLabel(linkedAssessment.Status),
                AssessmentScore = linkedAssessment?.Score,
                AssessmentVerdict = linkedAssessment?.Verdict ?? string.Empty,
                AssessmentSubmittedAt = linkedAssessment?.SubmittedAt,
            };
        }).ToList();
    }

    private async Task<List<JobApplicationDto>> MapPublicApplications(List<PublicJobApplication> applications)
    {
        if (applications.Count == 0)
        {
            return new List<JobApplicationDto>();
        }

        var applicationIds = applications.Select(x => x.Id).ToList();
        List<JobAssessment> assessments;
        try
        {
            assessments = await _jobAssessmentRepository.GetAll()
                .Where(x => x.PublicJobApplicationId.HasValue && applicationIds.Contains(x.PublicJobApplicationId.Value))
                .ToListAsync();
        }
        catch (Exception ex) when (IsMissingRelation(ex))
        {
            assessments = new List<JobAssessment>();
        }
        var assessmentsByPublicApplicationId = assessments
            .Where(x => x.PublicJobApplicationId.HasValue)
            .GroupBy(x => x.PublicJobApplicationId!.Value)
            .ToDictionary(x => x.Key, x => x.OrderByDescending(y => y.LastModificationTime ?? y.CreationTime).First());

        var developerIds = applications
            .Where(x => x.CandidateDeveloperId.HasValue)
            .Select(x => x.CandidateDeveloperId!.Value)
            .Distinct()
            .ToList();

        List<Developer> developers = new();
        Dictionary<long, User> users = new();
        if (developerIds.Count > 0)
        {
            using (CurrentUnitOfWork.DisableFilter(AbpDataFilters.MayHaveTenant, AbpDataFilters.MustHaveTenant))
            {
                developers = await _developerRepository.GetAll()
                    .Where(x => developerIds.Contains(x.Id))
                    .ToListAsync();
                var userIds = developers.Select(x => x.UserId).Distinct().ToList();
                users = await _userRepository.GetAll()
                    .Where(x => userIds.Contains(x.Id))
                    .ToDictionaryAsync(x => x.Id, x => x);
            }
        }

        return applications.Select(application =>
        {
            User user = null;
            if (application.CandidateDeveloperId.HasValue)
            {
                var dev = developers.FirstOrDefault(x => x.Id == application.CandidateDeveloperId.Value);
                if (dev != null)
                {
                    users.TryGetValue(dev.UserId, out user);
                }
            }

            var fullName = string.Join(" ", new[] { user?.Name, user?.Surname }.Where(x => !string.IsNullOrWhiteSpace(x)));
            var candidateName = !string.IsNullOrWhiteSpace(application.FullName)
                ? application.FullName
                : (string.IsNullOrWhiteSpace(fullName) ? user?.UserName ?? "Candidate" : fullName);
            var candidateEmail = !string.IsNullOrWhiteSpace(application.Email)
                ? application.Email
                : user?.EmailAddress ?? string.Empty;

            var assessment = ParseAssessmentFromApplicationResponse(application.ApplicationResponseJson);
            assessmentsByPublicApplicationId.TryGetValue(application.Id, out var linkedAssessment);

            return new JobApplicationDto
            {
                Id = application.Id,
                JobId = application.JobId,
                CandidateDeveloperId = application.CandidateDeveloperId ?? Guid.Empty,
                CandidateName = candidateName,
                CandidateEmail = candidateEmail,
                ResumeStoredFileId = application.ResumeStoredFileId,
                MatchScore = application.MatchScore,
                MatchReason = application.MatchReason,
                Source = ToSourceLabel(application.Source),
                Status = ToStatusLabel(application.Status),
                CreatedAt = application.CreationTime,
                IsPublicApplication = true,
                ApplicationResponseJson = application.ApplicationResponseJson ?? string.Empty,
                AiStrengths = assessment.Strengths,
                AiWeaknesses = assessment.Weaknesses,
                AiVerdict = assessment.Verdict,
                AiExtractedSkills = assessment.ExtractedSkills,
                AiGithubRepo = assessment.GithubRepo,
                AiGithubUsername = assessment.GithubUsername,
                AiGithubProfileSummary = assessment.GithubProfileSummary,
                AiGithubDocumentationScore = assessment.DocumentationScore,
                AiGithubDocumentationNotes = assessment.DocumentationNotes,
                AiGithubAnalysisConfidence = assessment.AnalysisConfidence,
                AiGithubAnalysisSourceStatus = assessment.AnalysisSourceStatus,
                AiProjects = ToProjectDtos(assessment.Projects),
                AiMosaic = assessment.Mosaic,
                AiExperienceHighlights = assessment.ExperienceHighlights,
                AiTotalExperienceYears = assessment.TotalExperienceYears,
                AssessmentId = linkedAssessment?.Id,
                AssessmentStatus = linkedAssessment == null ? string.Empty : ToAssessmentStatusLabel(linkedAssessment.Status),
                AssessmentScore = linkedAssessment?.Score,
                AssessmentVerdict = linkedAssessment?.Verdict ?? string.Empty,
                AssessmentSubmittedAt = linkedAssessment?.SubmittedAt,
            };
        }).ToList();
    }

    private async Task<Company> GetCompanyByTenant(int tenantId)
    {
        var company = await _companyRepository.GetAll()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId);
        if (company == null)
        {
            throw new UserFriendlyException("Company account not found.");
        }

        return company;
    }

    private async Task<CompanyJobsPageSettings> GetOrCreatePageSettings(int tenantId, Guid companyId)
    {
        var settings = await TryGetPageSettingsOrNull(tenantId, companyId);
        if (settings != null)
        {
            return settings;
        }

        settings = new CompanyJobsPageSettings
        {
            TenantId = tenantId,
            CompanyId = companyId,
            HeroTitle = "Build your career with us",
            HeroSubtitle = "Apply to open roles and show your strengths.",
            HeroImageUrl = string.Empty,
            PrimaryColor = "#D4AF37",
            LayoutJson = BuildDefaultLayoutJson(),
            ApplicationFormJson = JsonSerializer.Serialize(new
            {
                fields = new[]
                {
                    new { key = "technicalAssessmentAnswer", label = "Technical Assessment", type = "textarea", required = false, placeholder = "Tell us how you solve technical challenges." },
                    new { key = "behaviouralAssessmentAnswer", label = "Behavioural Assessment", type = "textarea", required = false, placeholder = "Describe your collaboration and communication style." },
                }
            }),
            EmailTemplateSettingsJson = BuildDefaultEmailTemplateSettingsJson(),
        };

        try
        {
            await _jobsPageSettingsRepository.InsertAsync(settings);
            await CurrentUnitOfWork.SaveChangesAsync();
        }
        catch (Exception ex) when (IsMissingRelation(ex))
        {
            return settings;
        }
        return settings;
    }

    private static PublicJobsPageDto MapPublicJobsPage(Company company, CompanyJobsPageSettings settings)
    {
        return new PublicJobsPageDto
        {
            CompanyId = company.Id,
            CompanyName = company.Name,
            TenancyName = company.TenancyName,
            CompanyLogoStoredFileId = company.LogoStoredFileId ?? string.Empty,
            CompanyEmail = company.Email ?? string.Empty,
            CompanyWebsiteUrl = company.Website ?? string.Empty,
            HeroTitle = settings?.HeroTitle ?? "Build your career with us",
            HeroSubtitle = settings?.HeroSubtitle ?? "Apply to open roles and show your strengths.",
            HeroImageUrl = settings?.HeroImageUrl ?? string.Empty,
            PrimaryColor = string.IsNullOrWhiteSpace(settings?.PrimaryColor) ? "#D4AF37" : settings.PrimaryColor,
            LayoutJson = string.IsNullOrWhiteSpace(settings?.LayoutJson) ? BuildDefaultLayoutJson() : settings.LayoutJson,
            ApplicationFormJson = settings?.ApplicationFormJson ?? JsonSerializer.Serialize(new
            {
                fields = new[]
                {
                    new { key = "technicalAssessmentAnswer", label = "Technical Assessment", type = "textarea", required = false, placeholder = "Tell us how you solve technical challenges." },
                    new { key = "behaviouralAssessmentAnswer", label = "Behavioural Assessment", type = "textarea", required = false, placeholder = "Describe your collaboration and communication style." },
                }
            }),
            EmailTemplateSettingsJson = string.IsNullOrWhiteSpace(settings?.EmailTemplateSettingsJson)
                ? BuildDefaultEmailTemplateSettingsJson()
                : settings.EmailTemplateSettingsJson,
        };
    }

    public async Task SendApplicationEmail(SendApplicationEmailInput input)
    {
        if (string.IsNullOrWhiteSpace(input.Subject) || string.IsNullOrWhiteSpace(input.Message))
        {
            throw new UserFriendlyException("Subject and message are required.");
        }

        var memberApplication = await _jobApplicationRepository.FirstOrDefaultAsync(input.JobApplicationId);
        if (memberApplication != null)
        {
            var job = await _jobRepository.FirstOrDefaultAsync(memberApplication.JobId)
                ?? throw new UserFriendlyException("Job not found.");
            await EnsureCompanyEmployee(job.CompanyId);

            var company = await _companyRepository.FirstOrDefaultAsync(job.CompanyId)
                ?? throw new UserFriendlyException("Company not found.");
            var settings = await TryGetPageSettingsOrNull(company.TenantId, company.Id);

            var recipient = await ResolveMemberApplicationRecipientAsync(memberApplication);
            if (string.IsNullOrWhiteSpace(recipient.Email))
            {
                throw new UserFriendlyException("Applicant email was not found.");
            }

            var body = ReplaceEmailTokens(
                input.Message,
                company,
                job,
                new PublicJobApplication { FullName = recipient.Name, Email = recipient.Email },
                new ApplicationAssessment { Score = memberApplication.MatchScore, Verdict = memberApplication.MatchReason });
            var brandColor = string.IsNullOrWhiteSpace(settings?.PrimaryColor) ? "#D4AF37" : settings.PrimaryColor.Trim();
            var html = BuildBrandedEmailHtml(input.Subject.Trim(), body, brandColor, company.Name, company.Website, company.Email);
            await SendEmailWithBrevoAsync(recipient.Email, recipient.Name, input.Subject.Trim(), html);
            return;
        }

        var publicApplication = await _publicJobApplicationRepository.FirstOrDefaultAsync(input.JobApplicationId)
            ?? throw new UserFriendlyException("Application not found.");
        var publicJob = await _jobRepository.FirstOrDefaultAsync(publicApplication.JobId)
            ?? throw new UserFriendlyException("Job not found.");
        await EnsureCompanyEmployee(publicJob.CompanyId);

        var publicCompany = await _companyRepository.FirstOrDefaultAsync(publicJob.CompanyId)
            ?? throw new UserFriendlyException("Company not found.");
        var publicSettings = await TryGetPageSettingsOrNull(publicCompany.TenantId, publicCompany.Id);
        var assessment = ParseAssessmentFromApplicationResponse(publicApplication.ApplicationResponseJson);
        if (string.IsNullOrWhiteSpace(publicApplication.Email))
        {
            throw new UserFriendlyException("Applicant email was not found.");
        }

        var publicBody = ReplaceEmailTokens(input.Message, publicCompany, publicJob, publicApplication, assessment);
        var publicBrandColor = string.IsNullOrWhiteSpace(publicSettings?.PrimaryColor) ? "#D4AF37" : publicSettings.PrimaryColor.Trim();
        var publicHtml = BuildBrandedEmailHtml(input.Subject.Trim(), publicBody, publicBrandColor, publicCompany.Name, publicCompany.Website, publicCompany.Email);
        await SendEmailWithBrevoAsync(publicApplication.Email, publicApplication.FullName, input.Subject.Trim(), publicHtml);
    }

    private static List<string> ParseLayoutOrDefault(string layoutJson)
    {
        if (string.IsNullOrWhiteSpace(layoutJson))
        {
            return new List<string> { "hero", "text", "job-list", "form", "cta" };
        }

        try
        {
            using var doc = JsonDocument.Parse(layoutJson);
            if (doc.RootElement.TryGetProperty("components", out var componentsNode) && componentsNode.ValueKind == JsonValueKind.Array)
            {
                return componentsNode.EnumerateArray()
                    .Select(x => x.GetString())
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .ToList();
            }
        }
        catch
        {
            return new List<string> { "hero", "text", "job-list", "form", "cta" };
        }

        return new List<string> { "hero", "text", "job-list", "form", "cta" };
    }

    private static string BuildDefaultLayoutJson()
    {
        return JsonSerializer.Serialize(new
        {
            blocks = new object[]
            {
                new
                {
                    id = "hero-1",
                    type = "hero",
                    props = new
                    {
                        title = "Ready to become a team member?",
                        subtitle = "Welcome to our recruitment platform. Explore opportunities and apply with confidence."
                    }
                },
                new
                {
                    id = "text-1",
                    type = "text",
                    props = new
                    {
                        content = "We are excited to have you explore our career opportunities.\nOur platform connects you directly with our Human Capital team."
                    }
                },
                new
                {
                    id = "jobs-1",
                    type = "job-list",
                    props = new
                    {
                        title = "Our Openings",
                        subtitle = "Open positions",
                        showCount = "true",
                        label = "Apply"
                    }
                },
                new
                {
                    id = "form-1",
                    type = "form",
                    props = new
                    {
                        title = "Submit your application",
                        subtitle = "Even if no role fits yet, you can still submit your profile."
                    }
                },
                new
                {
                    id = "cta-1",
                    type = "cta",
                    props = new
                    {
                        title = "Keep in touch",
                        subtitle = "Met us at a career fair? Share your details and stay connected."
                    }
                }
            }
        });
    }

    private static string BuildDefaultEmailTemplateSettingsJson()
    {
        return JsonSerializer.Serialize(new
        {
            applicationReceived = new
            {
                enabled = true,
                mode = "manual",
                subject = "Application received for {jobTitle}",
                body = "Hi {candidateName},\n\nThanks for applying to {companyName} for {jobTitle}. We received your application.\n\nComplete your assessment here:\n{assessmentLink}\n\nRegards,\n{companyName} Team",
            }
        });
    }

    private EmailTemplateSettings ParseEmailTemplateSettings(string json)
    {
        var fallback = new EmailTemplateSettings();
        if (string.IsNullOrWhiteSpace(json))
        {
            return fallback;
        }

        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("applicationReceived", out var node) && node.ValueKind == JsonValueKind.Object)
            {
                if (node.TryGetProperty("enabled", out var enabledNode) &&
                    (enabledNode.ValueKind == JsonValueKind.True || enabledNode.ValueKind == JsonValueKind.False))
                {
                    fallback.ApplicationReceivedEnabled = enabledNode.GetBoolean();
                }

                if (node.TryGetProperty("mode", out var modeNode) && modeNode.ValueKind == JsonValueKind.String)
                {
                    fallback.ApplicationReceivedMode = modeNode.GetString() ?? fallback.ApplicationReceivedMode;
                }

                if (node.TryGetProperty("subject", out var subjectNode) && subjectNode.ValueKind == JsonValueKind.String)
                {
                    fallback.ApplicationReceivedSubject = subjectNode.GetString() ?? fallback.ApplicationReceivedSubject;
                }

                if (node.TryGetProperty("body", out var bodyNode) && bodyNode.ValueKind == JsonValueKind.String)
                {
                    fallback.ApplicationReceivedBody = bodyNode.GetString() ?? fallback.ApplicationReceivedBody;
                }
            }
        }
        catch
        {
            return fallback;
        }

        return fallback;
    }

    private async Task SendApplicationReceivedEmailAsync(
        Company company,
        CompanyJobsPageSettings settings,
        Job job,
        PublicJobApplication application,
        ApplicationAssessment assessment,
        string assessmentLink)
    {
        var emailSettings = ParseEmailTemplateSettings(settings?.EmailTemplateSettingsJson);
        if (!emailSettings.ApplicationReceivedEnabled)
        {
            return;
        }

        var recipient = application.Email?.Trim();
        if (string.IsNullOrWhiteSpace(recipient))
        {
            return;
        }

        var subjectTemplate = string.IsNullOrWhiteSpace(emailSettings.ApplicationReceivedSubject)
            ? "Application received for {jobTitle}"
            : emailSettings.ApplicationReceivedSubject;
        var subject = ReplaceEmailTokens(subjectTemplate, company, job, application, assessment, assessmentLink);

        var bodyText = string.Empty;
        if (string.Equals(emailSettings.ApplicationReceivedMode, "ai", StringComparison.OrdinalIgnoreCase) && _groqChatService.IsConfigured())
        {
            bodyText = await GenerateApplicationReceivedEmailBodyWithAi(company, job, application, assessment);
        }

        if (string.IsNullOrWhiteSpace(bodyText))
        {
            var bodyTemplate = string.IsNullOrWhiteSpace(emailSettings.ApplicationReceivedBody)
                ? "Hi {candidateName},\n\nThanks for applying to {companyName} for {jobTitle}. We received your application.\n\nComplete your assessment here:\n{assessmentLink}\n\nRegards,\n{companyName} Team"
                : emailSettings.ApplicationReceivedBody;
            bodyText = ReplaceEmailTokens(bodyTemplate, company, job, application, assessment, assessmentLink);
        }

        var brandColor = string.IsNullOrWhiteSpace(settings?.PrimaryColor) ? "#D4AF37" : settings.PrimaryColor.Trim();
        var html = BuildBrandedEmailHtml(subject, bodyText, brandColor, company.Name, company.Website, company.Email);
        await SendEmailWithBrevoAsync(recipient, application.FullName, subject, html);
    }

    private async Task<string> GenerateApplicationReceivedEmailBodyWithAi(
        Company company,
        Job job,
        PublicJobApplication application,
        ApplicationAssessment assessment)
    {
        try
        {
            var systemPrompt = "Write concise professional recruitment confirmation emails. Return plain text only.";
            var userPrompt =
                $"Company: {company.Name}\n" +
                $"Role: {job.Title}\n" +
                $"Candidate: {application.FullName}\n" +
                $"Match score: {assessment.Score}\n" +
                $"Verdict: {assessment.Verdict}\n" +
                $"Strengths: {string.Join(", ", assessment.Strengths)}\n" +
                "Write a warm confirmation email acknowledging receipt, set expectations, and keep it under 140 words.";
            var response = await _groqChatService.TryCompleteAsync(systemPrompt, userPrompt);
            return response?.Trim() ?? string.Empty;
        }
        catch
        {
            return string.Empty;
        }
    }

    private static string BuildBrandedEmailHtml(
        string subject,
        string bodyText,
        string primaryColor,
        string companyName,
        string companyWebsite,
        string companyEmail)
    {
        var safeBody = WebUtility.HtmlEncode(bodyText ?? string.Empty).Replace("\n", "<br/>");
        var safeSubject = WebUtility.HtmlEncode(subject ?? string.Empty);
        var safeCompanyName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(companyName) ? "Mosaic Talent" : companyName);
        var safeWebsite = WebUtility.HtmlEncode(companyWebsite ?? string.Empty);
        var safeEmail = WebUtility.HtmlEncode(companyEmail ?? string.Empty);
        var footerBits = new List<string>();
        if (!string.IsNullOrWhiteSpace(safeWebsite))
        {
            footerBits.Add($"Website: <a href=\"{safeWebsite}\" style=\"color:{primaryColor};\">{safeWebsite}</a>");
        }

        if (!string.IsNullOrWhiteSpace(safeEmail))
        {
            footerBits.Add($"Email: <a href=\"mailto:{safeEmail}\" style=\"color:{primaryColor};\">{safeEmail}</a>");
        }

        var footer = string.Join("&nbsp; | &nbsp;", footerBits);

        return
            "<!doctype html><html><body style=\"margin:0;background:#0f1115;padding:24px;font-family:Segoe UI,Arial,sans-serif;color:#e8eaed;\">" +
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tr><td align=\"center\">" +
            "<table role=\"presentation\" width=\"640\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:640px;background:#151821;border:1px solid #2a2f3a;border-radius:14px;overflow:hidden;\">" +
            $"<tr><td style=\"background:{primaryColor};padding:20px 28px;text-align:center;\">" +
            "<img src=\"https://mosaic-talent.vercel.app/text-logo.svg\" alt=\"Mosaic Talent\" style=\"height:28px;max-width:100%;display:inline-block;\" />" +
            "</td></tr>" +
            "<tr><td style=\"padding:28px;\">" +
            $"<h2 style=\"margin:0 0 16px 0;color:#ffffff;font-size:20px;line-height:1.3;\">{safeSubject}</h2>" +
            $"<div style=\"font-size:15px;line-height:1.7;color:#d4d8de;\">{safeBody}</div>" +
            "</td></tr>" +
            "<tr><td style=\"padding:18px 28px;border-top:1px solid #2a2f3a;color:#9aa4b2;font-size:12px;line-height:1.5;\">" +
            $"<div>{safeCompanyName}</div>" +
            (!string.IsNullOrWhiteSpace(footer) ? $"<div style=\"margin-top:6px;\">{footer}</div>" : string.Empty) +
            "</td></tr></table></td></tr></table></body></html>";
    }

    private async Task SendEmailWithBrevoAsync(string toEmail, string toName, string subject, string html)
    {
        var apiKey = _configuration["Brevo:ApiKey"] ?? _configuration["Brevo__ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return;
        }

        var senderName = (_configuration["Brevo:SenderName"] ?? _configuration["Brevo__SenderName"] ?? "Mosaic Talent").Trim();
        var senderEmail = (_configuration["Brevo:SenderEmail"] ?? _configuration["Brevo__SenderEmail"] ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(senderEmail) || !senderEmail.Contains("@", StringComparison.Ordinal))
        {
            throw new UserFriendlyException("Email sender is not configured. Set Brevo:SenderEmail to a valid sender.");
        }

        if (string.IsNullOrWhiteSpace(toEmail))
        {
            throw new UserFriendlyException("Recipient email is required.");
        }

        var payload = new
        {
            sender = new
            {
                name = senderName,
                email = senderEmail,
            },
            to = new[]
            {
                new
                {
                    email = toEmail,
                    name = string.IsNullOrWhiteSpace(toName) ? toEmail : toName,
                }
            },
            subject,
            htmlContent = html,
        };

        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(20);
        client.DefaultRequestHeaders.Remove("api-key");
        client.DefaultRequestHeaders.Add("api-key", apiKey);
        var request = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
        using var response = await client.PostAsync("https://api.brevo.com/v3/smtp/email", request);
        if (!response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            throw new UserFriendlyException($"Email delivery failed: {content}");
        }
    }

    private static string ReplaceEmailTokens(
        string template,
        Company company,
        Job job,
        PublicJobApplication application,
        ApplicationAssessment assessment,
        string assessmentLink = "")
    {
        var output = template ?? string.Empty;
        output = output.Replace("{candidateName}", application.FullName ?? "Candidate", StringComparison.OrdinalIgnoreCase);
        output = output.Replace("{jobTitle}", job.Title ?? "this role", StringComparison.OrdinalIgnoreCase);
        output = output.Replace("{companyName}", company.Name ?? "our company", StringComparison.OrdinalIgnoreCase);
        output = output.Replace("{matchScore}", assessment.Score.ToString("0.#"), StringComparison.OrdinalIgnoreCase);
        output = output.Replace("{verdict}", assessment.Verdict ?? "pending review", StringComparison.OrdinalIgnoreCase);
        output = output.Replace("{assessmentLink}", assessmentLink ?? string.Empty, StringComparison.OrdinalIgnoreCase);
        return output.Trim();
    }

    private async Task EnsureCompanyEmployee(Guid companyId)
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var isEmployee = await _companyEmployeeRepository.GetAll()
            .AnyAsync(x => x.CompanyId == companyId && x.UserId == userId);
        if (!isEmployee)
        {
            throw new UserFriendlyException("You are not a company employee.");
        }
    }

    private async Task<bool> IsCurrentUserCompanyEmployee(Guid companyId)
    {
        var userId = AbpSession.UserId;
        if (!userId.HasValue)
        {
            return false;
        }

        return await _companyEmployeeRepository.GetAll()
            .AnyAsync(x => x.CompanyId == companyId && x.UserId == userId.Value);
    }

    private async Task EnsureCompanyAdmin(Guid companyId)
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var isAdmin = await _companyEmployeeRepository.GetAll()
            .AnyAsync(x => x.CompanyId == companyId && x.UserId == userId && x.Role == CompanyRole.Admin);

        if (!isAdmin)
        {
            throw new UserFriendlyException("Only company admins can perform this action.");
        }
    }

    private async Task EnsureJobVisible(Job job)
    {
        var isEmployee = await IsCurrentUserCompanyEmployee(job.CompanyId);
        if (!isEmployee && !job.IsOpen)
        {
            throw new UserFriendlyException("Job not found.");
        }
    }

    private async Task EnsureJobAdmin(Job job)
    {
        await EnsureCompanyAdmin(job.CompanyId);
    }

    private async Task<Developer> GetCurrentDeveloper()
    {
        var developer = await GetCurrentDeveloperOrNull();
        return developer ?? throw new UserFriendlyException("Developer profile not found.");
    }

    private async Task<Developer> GetCurrentDeveloperOrNull()
    {
        var userId = AbpSession.UserId;
        if (!userId.HasValue)
        {
            return null;
        }

        using (CurrentUnitOfWork.DisableFilter(AbpDataFilters.MayHaveTenant, AbpDataFilters.MustHaveTenant))
        {
            return await _developerRepository.GetAll()
                .FirstOrDefaultAsync(x => x.UserId == userId.Value);
        }
    }

    private async Task<(string Name, string Email)> ResolveMemberApplicationRecipientAsync(JobApplication application)
    {
        using (CurrentUnitOfWork.DisableFilter(AbpDataFilters.MayHaveTenant, AbpDataFilters.MustHaveTenant))
        {
            var developer = await _developerRepository.FirstOrDefaultAsync(application.CandidateDeveloperId);
            if (developer == null)
            {
                return (string.Empty, string.Empty);
            }

            var user = await _userRepository.FirstOrDefaultAsync(developer.UserId);
            if (user == null)
            {
                return (string.Empty, string.Empty);
            }

            var fullName = string.Join(" ", new[] { user.Name, user.Surname }.Where(x => !string.IsNullOrWhiteSpace(x)));
            var candidateName = string.IsNullOrWhiteSpace(fullName) ? user.UserName : fullName;
            return (candidateName ?? string.Empty, user.EmailAddress ?? string.Empty);
        }
    }

    private async Task<long?> ResolveMemberApplicationUserIdAsync(JobApplication application)
    {
        using (CurrentUnitOfWork.DisableFilter(AbpDataFilters.MayHaveTenant, AbpDataFilters.MustHaveTenant))
        {
            var developer = await _developerRepository.FirstOrDefaultAsync(application.CandidateDeveloperId);
            return developer?.UserId;
        }
    }

    private async Task<long?> ResolvePublicApplicationUserIdAsync(PublicJobApplication application)
    {
        if (!application.CandidateDeveloperId.HasValue)
        {
            return null;
        }

        using (CurrentUnitOfWork.DisableFilter(AbpDataFilters.MayHaveTenant, AbpDataFilters.MustHaveTenant))
        {
            var developer = await _developerRepository.FirstOrDefaultAsync(application.CandidateDeveloperId.Value);
            return developer?.UserId;
        }
    }

    private async Task<long?> ResolveAssessmentCandidateUserIdAsync(JobAssessment assessment)
    {
        if (assessment.JobApplicationId.HasValue)
        {
            var memberApplication = await _jobApplicationRepository.FirstOrDefaultAsync(assessment.JobApplicationId.Value);
            if (memberApplication != null)
            {
                return await ResolveMemberApplicationUserIdAsync(memberApplication);
            }
        }

        if (assessment.PublicJobApplicationId.HasValue)
        {
            var publicApplication = await _publicJobApplicationRepository.FirstOrDefaultAsync(assessment.PublicJobApplicationId.Value);
            if (publicApplication != null)
            {
                return await ResolvePublicApplicationUserIdAsync(publicApplication);
            }
        }

        return null;
    }

    private async Task TrySendAssessmentInviteForMemberApplication(Job job, JobApplication application)
    {
        try
        {
            var recipient = await ResolveMemberApplicationRecipientAsync(application);
            if (string.IsNullOrWhiteSpace(recipient.Email))
            {
                return;
            }

            var assessment = await EnsureAssessmentForMemberApplication(job, application, recipient.Name, recipient.Email);
            var link = BuildAssessmentUrl(assessment.Id);
            var subject = $"Assessment invitation: {job.Title}";
            var body =
                $"Hi {recipient.Name},\n\n" +
                $"You have been moved to the assessment stage for {job.Title}.\n" +
                $"Please complete your assessment here:\n{link}\n\n" +
                "Regards,\nHiring Team";
            var company = await GetCompanyByTenant(job.TenantId);
            var html = BuildBrandedEmailHtml(
                subject,
                body,
                "#D4AF37",
                company.Name ?? "Mosaic Talent",
                company.Website,
                company.Email);
            await SendEmailWithBrevoAsync(recipient.Email, recipient.Name, subject, html);
        }
        catch (Exception ex)
        {
            Logger.Warn("Assessment invite email failed for member application.", ex);
        }
    }

    private async Task TrySendAssessmentInviteForPublicApplication(Job job, PublicJobApplication application)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(application.Email))
            {
                return;
            }

            var assessment = await EnsureAssessmentForPublicApplication(job, application);
            var link = BuildAssessmentUrl(assessment.Id);
            var subject = $"Assessment invitation: {job.Title}";
            var body =
                $"Hi {application.FullName},\n\n" +
                $"You have been moved to the assessment stage for {job.Title}.\n" +
                $"Please complete your assessment here:\n{link}\n\n" +
                "Regards,\nHiring Team";
            var company = await GetCompanyByTenant(job.TenantId);
            var html = BuildBrandedEmailHtml(
                subject,
                body,
                "#D4AF37",
                company.Name ?? "Mosaic Talent",
                company.Website,
                company.Email);
            await SendEmailWithBrevoAsync(application.Email.Trim(), application.FullName, subject, html);
        }
        catch (Exception ex)
        {
            Logger.Warn("Assessment invite email failed for public application.", ex);
        }
    }

    private string BuildAssessmentUrl(Guid assessmentId)
    {
        var clientRoot = ResolveClientRootAddress();
        if (string.IsNullOrWhiteSpace(clientRoot))
        {
            return $"/assessment/{assessmentId}";
        }

        return $"{clientRoot}/assessment/{assessmentId}";
    }

    private string ResolveClientRootAddress()
    {
        var request = _httpContextAccessor.HttpContext?.Request;

        // Prefer browser-origin headers so links target the tenant frontend domain.
        var fromOriginHeader = ReadOriginFromHeaders(request);
        if (!string.IsNullOrWhiteSpace(fromOriginHeader))
        {
            return fromOriginHeader;
        }

        // Then use configured frontend root when available.
        var configuredClientRoot = (_configuration["App:ClientRootAddress"] ?? _configuration["App__ClientRootAddress"] ?? string.Empty)
            .Trim()
            .TrimEnd('/');
        if (!string.IsNullOrWhiteSpace(configuredClientRoot))
        {
            return configuredClientRoot;
        }

        // Fallback: use current request host as last resort.
        if (request != null && request.Host.HasValue)
        {
            return $"{request.Scheme}://{request.Host.Value}";
        }

        return string.Empty;
    }

    private static string ReadOriginFromHeaders(HttpRequest request)
    {
        if (request == null)
        {
            return string.Empty;
        }

        if (request.Headers.TryGetValue("Origin", out var originValues))
        {
            var origin = originValues.FirstOrDefault();
            if (Uri.TryCreate(origin, UriKind.Absolute, out var originUri))
            {
                return $"{originUri.Scheme}://{originUri.Authority}";
            }
        }

        if (request.Headers.TryGetValue("Referer", out var refererValues))
        {
            var referer = refererValues.FirstOrDefault();
            if (Uri.TryCreate(referer, UriKind.Absolute, out var refererUri))
            {
                return $"{refererUri.Scheme}://{refererUri.Authority}";
            }
        }

        if (request.Headers.TryGetValue("X-Forwarded-Proto", out var protoValues) &&
            request.Headers.TryGetValue("X-Forwarded-Host", out var hostValues))
        {
            var proto = (protoValues.FirstOrDefault() ?? string.Empty).Split(',').FirstOrDefault()?.Trim();
            var host = (hostValues.FirstOrDefault() ?? string.Empty).Split(',').FirstOrDefault()?.Trim();
            if (!string.IsNullOrWhiteSpace(proto) && !string.IsNullOrWhiteSpace(host))
            {
                return $"{proto}://{host}";
            }
        }

        return string.Empty;
    }

    private async Task<JobAssessment> EnsureAssessmentForMemberApplication(Job job, JobApplication application, string candidateName, string candidateEmail)
    {
        var existing = await _jobAssessmentRepository.GetAll()
            .FirstOrDefaultAsync(x => x.JobApplicationId == application.Id);
        if (existing != null)
        {
            return existing;
        }

        var fallback = new ApplicationAssessment
        {
            Score = application.MatchScore,
            Summary = application.MatchReason ?? string.Empty,
            Verdict = "Pending assessment",
            Strengths = new List<string>(),
            Weaknesses = new List<string>(),
        };

        return await CreateAssessmentRecordAsync(
            job,
            candidateName,
            candidateEmail,
            application.Id,
            null,
            fallback,
            string.Empty);
    }

    private async Task<JobAssessment> EnsureAssessmentForPublicApplication(Job job, PublicJobApplication application)
    {
        var existing = await _jobAssessmentRepository.GetAll()
            .FirstOrDefaultAsync(x => x.PublicJobApplicationId == application.Id);
        if (existing != null)
        {
            return existing;
        }

        var parsed = ParseAssessmentFromApplicationResponse(application.ApplicationResponseJson);
        return await CreateAssessmentRecordAsync(
            job,
            application.FullName,
            application.Email,
            null,
            application.Id,
            parsed,
            string.Empty);
    }

    private async Task<JobAssessment> CreateAssessmentRecordAsync(
        Job job,
        string candidateName,
        string candidateEmail,
        Guid? jobApplicationId,
        Guid? publicJobApplicationId,
        ApplicationAssessment aiAssessment,
        string resumeText)
    {
        var blueprint = await BuildAssessmentBlueprintAsync(job, candidateName, candidateEmail, aiAssessment, resumeText);
        var prompt = blueprint.Prompt;
        var instructions = blueprint.Instructions;
        var workMode = string.IsNullOrWhiteSpace(blueprint.WorkMode) ? ResolveWorkMode(job) : blueprint.WorkMode;
        var endpointHints = blueprint.EndpointHints ?? new List<string>();
        var interactiveQuestions = blueprint.InteractiveQuestions ?? BuildInteractiveQuestions(workMode, job, aiAssessment);
        var contextJson = JsonSerializer.Serialize(new
        {
            skills = aiAssessment.ExtractedSkills ?? new List<string>(),
            strengths = aiAssessment.Strengths ?? new List<string>(),
            weaknesses = aiAssessment.Weaknesses ?? new List<string>(),
            verdict = aiAssessment.Verdict ?? string.Empty,
            score = aiAssessment.Score,
            projects = (aiAssessment.Projects ?? new List<ProjectInsight>()).Select(x => new
            {
                name = x.Name,
                description = x.Description,
                score = x.Score,
                technologies = x.Technologies ?? new List<string>(),
            }).ToList(),
            strongLanguages = DeriveStrongLanguages(aiAssessment),
            generationSeed = blueprint.GenerationSeed,
            workMode,
            endpointHints,
            interactiveQuestions,
        });

        var assessment = new JobAssessment
        {
            TenantId = job.TenantId,
            JobId = job.Id,
            JobApplicationId = jobApplicationId,
            PublicJobApplicationId = publicJobApplicationId,
            CandidateName = (candidateName ?? string.Empty).Trim(),
            CandidateEmail = (candidateEmail ?? string.Empty).Trim().ToLowerInvariant(),
            Prompt = prompt,
            Instructions = instructions,
            ContextJson = contextJson,
            Status = AssessmentStatus.Pending,
            Score = 0,
            Verdict = "Awaiting submission",
        };

        await _jobAssessmentRepository.InsertAsync(assessment);
        return assessment;
    }

    private async Task<AssessmentBlueprint> BuildAssessmentBlueprintAsync(
        Job job,
        string candidateName,
        string candidateEmail,
        ApplicationAssessment aiAssessment,
        string resumeText)
    {
        var strongLanguages = DeriveStrongLanguages(aiAssessment);
        var topSkills = (aiAssessment.ExtractedSkills ?? new List<string>()).Take(8).ToList();
        var skillText = topSkills.Count == 0 ? "problem solving, communication, delivery" : string.Join(", ", topSkills);
        var fallbackMode = ResolveWorkMode(job);
        var fallbackPrompt =
            "Assessment Brief\n" +
            $"You are working as a {job.Title} on an active product initiative.\n" +
            $"Project context: {SafeTrim(job.Description)}\n\n" +
            "Your work will be evaluated on:\n" +
            "- implementation quality\n" +
            "- reasoning and trade-offs\n" +
            "- testing strategy\n" +
            "- risk awareness\n" +
            "- responsible AI usage\n\n" +
            "Deliverables\n" +
            "1) Core implementation plan\n" +
            "2) Code or pseudo-code for the main flow\n" +
            "3) Key states (loading, validation, error, success)\n" +
            "4) Testing strategy\n" +
            "5) Risk analysis and rollout notes\n" +
            "6) Short note on AI usage and validation\n\n" +
            $"Candidate focus skills: {skillText}";
        var fallbackInstructions =
            "Assessment Instructions:\n" +
            "- You may use AI coding assistants, but explain what you delegated and what you validated.\n" +
            "- Solve practical ticket tasks (not algorithm drills).\n" +
            "- Submit runnable code/pseudocode and keep decisions practical.\n" +
            "- Keep answers concise and production-oriented.\n\n" +
            $"Role: {job.Title}\n" +
            $"Focus skills: {string.Join(", ", aiAssessment.ExtractedSkills.Take(10))}";
        var fallback = new AssessmentBlueprint
        {
            Prompt = fallbackPrompt,
            Instructions = fallbackInstructions,
            WorkMode = fallbackMode,
            EndpointHints = new List<string>(),
            InteractiveQuestions = BuildInteractiveQuestions(fallbackMode, job, aiAssessment),
            GenerationSeed = BuildAssessmentGenerationSeed(job, candidateName, candidateEmail),
        };

        if (!_groqChatService.IsConfigured())
        {
            return fallback;
        }

        try
        {
            var systemPrompt =
                "You are generating a candidate-specific engineering assessment. " +
                "Output STRICT JSON only with keys: " +
                "workMode, prompt, instructions, interactiveQuestions, endpointHints, uniquenessNotes. " +
                "Rules: ticket must be highly different per candidate and per request; no algorithm puzzles; " +
                "endpointHints must be empty unless API/backend integration is required by the ticket; " +
                "if endpoints are included, include request/response expectations.";
            var seed = BuildAssessmentGenerationSeed(job, candidateName, candidateEmail);
            var userPrompt =
                $"Role: {job.Title}\n" +
                $"Description: {job.Description}\n" +
                $"Technical prompt: {job.TechnicalAssessmentPrompt}\n" +
                $"Behavioural prompt: {job.BehaviouralAssessmentPrompt}\n" +
                $"Candidate: {candidateName}\n" +
                $"Candidate email: {candidateEmail}\n" +
                $"Extracted skills: {string.Join(", ", aiAssessment.ExtractedSkills)}\n" +
                $"Strong languages (from CV/projects): {string.Join(", ", strongLanguages)}\n" +
                $"Projects (from CV): {JsonSerializer.Serialize((aiAssessment.Projects ?? new List<ProjectInsight>()).Select(x => new { x.Name, x.Description, x.Score, x.Technologies }))}\n" +
                $"Resume context: {resumeText}\n" +
                $"Uniqueness seed: {seed}\n" +
                "Generate one practical ticket-style assessment.\n" +
                "Required sections:\n" +
                "- Assessment Brief\n" +
                "- Main Ticket (title, context, requirements, constraints)\n" +
                "- Deliverables\n" +
                "- Collaboration scenario (1 prompt)\n" +
                "- AI usage reflection guidance\n" +
                "Keep under 650 words.\n" +
                "Make it materially different from common login task templates.";
            var response = await _groqChatService.TryCompleteAsync(systemPrompt, userPrompt);
            if (string.IsNullOrWhiteSpace(response))
            {
                return fallback;
            }

            using var doc = JsonDocument.Parse(response);
            if (doc.RootElement.ValueKind != JsonValueKind.Object)
            {
                return fallback;
            }

            var workMode = doc.RootElement.TryGetProperty("workMode", out var workModeNode)
                ? SafeTrim(workModeNode.GetString()).ToLowerInvariant()
                : fallback.WorkMode;
            if (workMode != "frontend" && workMode != "backend" && workMode != "fullstack")
            {
                workMode = fallback.WorkMode;
            }

            var prompt = doc.RootElement.TryGetProperty("prompt", out var promptNode) ? SafeTrim(promptNode.GetString()) : string.Empty;
            var instructions = doc.RootElement.TryGetProperty("instructions", out var instructionsNode) ? SafeTrim(instructionsNode.GetString()) : string.Empty;
            var interactiveQuestions = doc.RootElement.TryGetProperty("interactiveQuestions", out var questionsNode)
                ? ReadStringArray(questionsNode).Take(8).ToList()
                : new List<string>();
            if (interactiveQuestions.Count == 0)
            {
                interactiveQuestions = BuildInteractiveQuestions(workMode, job, aiAssessment);
            }

            var endpointHints = doc.RootElement.TryGetProperty("endpointHints", out var endpointNode)
                ? ReadStringArray(endpointNode).Take(8).ToList()
                : new List<string>();
            endpointHints = KeepOnlyRelevantEndpointHints(endpointHints, prompt, instructions);

            return new AssessmentBlueprint
            {
                Prompt = string.IsNullOrWhiteSpace(prompt) ? fallback.Prompt : prompt,
                Instructions = string.IsNullOrWhiteSpace(instructions) ? fallback.Instructions : instructions,
                WorkMode = workMode,
                EndpointHints = endpointHints,
                InteractiveQuestions = interactiveQuestions,
                GenerationSeed = seed,
            };
        }
        catch
        {
            return fallback;
        }
    }

    private static string BuildAssessmentInstructions(Job job, ApplicationAssessment aiAssessment)
    {
        return
            "Assessment Instructions:\n" +
            "- You may use AI coding assistants, but explain what you delegated and what you validated.\n" +
            "- Solve practical ticket tasks (not algorithm drills).\n" +
            "- Submit runnable code/pseudocode and keep decisions practical.\n" +
            "- Keep answers concise and production-oriented.\n\n" +
            $"Role: {job.Title}\n" +
            $"Focus skills: {string.Join(", ", aiAssessment.ExtractedSkills.Take(10))}";
    }

    private async Task<AssessmentEvaluation> EvaluateAssessmentSubmissionAsync(Job job, JobAssessment assessment)
    {
        var leetSubmission = ParseLeetPromptSubmission(assessment.SubmissionText, assessment.ContextJson);
        var fallback = BuildHeuristicAssessmentEvaluation(assessment.SubmissionText, assessment.SubmissionGithubRepo);
        if (leetSubmission != null)
        {
            fallback = MergeExecutionScoreIntoEvaluation(fallback, leetSubmission);
        }
        if (!_groqChatService.IsConfigured())
        {
            return fallback;
        }

        try
        {
            var systemPrompt =
                "You evaluate engineering assessments. Return JSON only with keys: " +
                "score (0-100), verdict, summary, strengths (array), weaknesses (array), tips (array).";
            var taskEvidence = BuildLeetPromptTaskEvidenceForAi(leetSubmission);
            var userPrompt =
                $"Role: {job.Title}\n" +
                $"Job description: {job.Description}\n" +
                $"Assessment prompt: {assessment.Prompt}\n" +
                $"Assessment instructions: {assessment.Instructions}\n" +
                $"Submission snapshot: {TruncateForPrompt(assessment.SubmissionText, 8000)}\n" +
                $"Task/file evidence: {taskEvidence}\n" +
                $"Github: {assessment.SubmissionGithubRepo}\n" +
                $"Execution summary: {BuildLeetPromptSummaryForAi(leetSubmission)}\n" +
                "Score for real-world readiness, clarity, trade-off quality, and AI-assistant usage maturity.";
            var response = await _groqChatService.TryCompleteAsync(systemPrompt, userPrompt);
            if (string.IsNullOrWhiteSpace(response))
            {
                return fallback;
            }

            using var doc = JsonDocument.Parse(response);
            var root = doc.RootElement;
            var score = root.TryGetProperty("score", out var scoreNode) && scoreNode.TryGetDouble(out var parsedScore)
                ? ClampScore(parsedScore)
                : fallback.Score;
            var verdict = root.TryGetProperty("verdict", out var verdictNode) ? SafeTrim(verdictNode.GetString()) : fallback.Verdict;
            var summary = root.TryGetProperty("summary", out var summaryNode) ? SafeTrim(summaryNode.GetString()) : fallback.Summary;
            var strengths = root.TryGetProperty("strengths", out var strengthsNode) ? ReadStringArray(strengthsNode) : fallback.Strengths;
            var weaknesses = root.TryGetProperty("weaknesses", out var weaknessesNode) ? ReadStringArray(weaknessesNode) : fallback.Weaknesses;
            var tips = root.TryGetProperty("tips", out var tipsNode) ? ReadStringArray(tipsNode) : fallback.Tips;

            return new AssessmentEvaluation
            {
                Score = score,
                Verdict = string.IsNullOrWhiteSpace(verdict) ? fallback.Verdict : verdict,
                Summary = string.IsNullOrWhiteSpace(summary) ? fallback.Summary : summary,
                Strengths = strengths.Count == 0 ? fallback.Strengths : strengths.Take(5).ToList(),
                Weaknesses = weaknesses.Count == 0 ? fallback.Weaknesses : weaknesses.Take(5).ToList(),
                Tips = tips.Count == 0 ? fallback.Tips : tips.Take(5).ToList(),
            };
        }
        catch
        {
            return fallback;
        }
    }

    private static AssessmentEvaluation BuildHeuristicAssessmentEvaluation(string submissionText, string githubRepo)
    {
        var text = (submissionText ?? string.Empty).ToLowerInvariant();
        var hasArchitecture = text.Contains("architecture") || text.Contains("design");
        var hasTesting = text.Contains("test") || text.Contains("testing");
        var hasTradeoffs = text.Contains("trade-off") || text.Contains("tradeoff") || text.Contains("pros") || text.Contains("cons");
        var hasAiReasoning = text.Contains("ai") || text.Contains("assistant") || text.Contains("copilot");
        var hasRepo = !string.IsNullOrWhiteSpace(githubRepo);

        var score = 45d;
        if (hasArchitecture) score += 12;
        if (hasTesting) score += 12;
        if (hasTradeoffs) score += 12;
        if (hasAiReasoning) score += 10;
        if (hasRepo) score += 9;
        score = ClampScore(score);

        var verdict = score >= 80 ? "Strong" : score >= 60 ? "Good" : "Needs improvement";
        return new AssessmentEvaluation
        {
            Score = score,
            Verdict = verdict,
            Summary = $"Assessment quality is {verdict.ToLowerInvariant()} based on structure, testing depth, and implementation clarity.",
            Strengths = new List<string>
            {
                hasArchitecture ? "Clear architectural thinking was shown." : "Submission provided a workable implementation direction.",
                hasTesting ? "Testing approach was addressed." : "Consider adding explicit test strategy.",
            },
            Weaknesses = new List<string>
            {
                hasTradeoffs ? "Trade-offs were mentioned but can be deeper." : "Trade-offs were not clearly discussed.",
                hasAiReasoning ? "AI usage was disclosed; include stronger validation details." : "No explicit AI-assistant usage reflection.",
            },
            Tips = new List<string>
            {
                "Explain why your design choices are better than alternatives.",
                "Add measurable acceptance criteria and edge-case tests.",
                "Document how AI-generated output was validated.",
            },
        };
    }

    private async Task ApplyAssessmentOutcomeToApplication(JobAssessment assessment, AssessmentEvaluation evaluation)
    {
        var verdictLabel = string.IsNullOrWhiteSpace(evaluation.Verdict) ? "Assessed" : evaluation.Verdict;
        var summary = string.IsNullOrWhiteSpace(evaluation.Summary)
            ? $"Assessment completed with score {evaluation.Score:0.#}."
            : evaluation.Summary;

        if (assessment.JobApplicationId.HasValue)
        {
            var member = await _jobApplicationRepository.FirstOrDefaultAsync(assessment.JobApplicationId.Value);
            if (member != null)
            {
                member.MatchScore = evaluation.Score;
                member.MatchReason = $"{verdictLabel}: {summary}";
                member.Status = ApplicationStatus.Assessment;
                await _jobApplicationRepository.UpdateAsync(member);
            }
        }

        if (assessment.PublicJobApplicationId.HasValue)
        {
            var candidate = await _publicJobApplicationRepository.FirstOrDefaultAsync(assessment.PublicJobApplicationId.Value);
            if (candidate != null)
            {
                candidate.MatchScore = evaluation.Score;
                candidate.MatchReason = $"{verdictLabel}: {summary}";
                candidate.Status = ApplicationStatus.Assessment;
                candidate.ApplicationResponseJson = MergeAssessmentEvaluationIntoResponse(candidate.ApplicationResponseJson, evaluation);
                await _publicJobApplicationRepository.UpdateAsync(candidate);
            }
        }
    }

    private static string MergeAssessmentEvaluationIntoResponse(string applicationResponseJson, AssessmentEvaluation evaluation)
    {
        var root = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(applicationResponseJson))
        {
            try
            {
                using var doc = JsonDocument.Parse(applicationResponseJson);
                if (doc.RootElement.ValueKind == JsonValueKind.Object)
                {
                    foreach (var property in doc.RootElement.EnumerateObject())
                    {
                        root[property.Name] = property.Value.ValueKind == JsonValueKind.String
                            ? property.Value.GetString()
                            : property.Value.ToString();
                    }
                }
            }
            catch
            {
                // ignore malformed json
            }
        }

        root["__assessment_score"] = evaluation.Score;
        root["__assessment_verdict"] = evaluation.Verdict;
        root["__assessment_summary"] = evaluation.Summary;
        root["__assessment_strengths"] = evaluation.Strengths;
        root["__assessment_weaknesses"] = evaluation.Weaknesses;
        root["__assessment_tips"] = evaluation.Tips;
        return JsonSerializer.Serialize(root);
    }

    private async Task PublishAssessmentCompletedNotificationAsync(Job job, JobAssessment assessment)
    {
        try
        {
            var employees = await _companyEmployeeRepository.GetAll()
                .Where(x => x.CompanyId == job.CompanyId)
                .Select(x => x.UserId)
                .Distinct()
                .ToListAsync();
            if (employees.Count == 0)
            {
                return;
            }

            var userIdentifiers = employees
                .Select(userId => new UserIdentifier(assessment.TenantId, userId))
                .ToArray();
            if (userIdentifiers.Length == 0)
            {
                return;
            }

            var message = $"{assessment.CandidateName} completed an assessment for {job.Title}.";
            await _notificationEventDispatcher.NotifyUsersAsync(
                assessment.TenantId,
                userIdentifiers.Select(x => x.UserId),
                "MosaicTalent.AssessmentCompleted",
                message,
                NotificationSeverity.Success,
                $"/app/jobs/{job.Id}",
                "Assessment completed",
                message);
        }
        catch (Exception ex)
        {
            Logger.Warn("Failed to publish assessment completion notification.", ex);
        }
    }

    private async Task NotifyCompanyAboutNewApplicationAsync(Job job, string candidateName)
    {
        var companyUserIds = await _companyEmployeeRepository.GetAll()
            .Where(x => x.CompanyId == job.CompanyId)
            .Select(x => x.UserId)
            .Distinct()
            .ToListAsync();
        if (companyUserIds.Count == 0)
        {
            return;
        }

        var safeCandidate = string.IsNullOrWhiteSpace(candidateName) ? "A candidate" : candidateName.Trim();
        var message = $"{safeCandidate} applied for {job.Title}.";
        await _notificationEventDispatcher.NotifyUsersAsync(
            job.TenantId,
            companyUserIds,
            "MosaicTalent.JobApplicationReceived",
            message,
            NotificationSeverity.Info,
            $"/app/jobs/{job.Id}",
            "New job application",
            message);
    }

    private async Task NotifyCandidateStatusChangedAsync(Job job, long? candidateUserId, string candidateName, ApplicationStatus status)
    {
        if (!candidateUserId.HasValue || candidateUserId.Value <= 0)
        {
            return;
        }

        var label = ToStatusLabel(status);
        var safeCandidate = string.IsNullOrWhiteSpace(candidateName) ? "Your application" : candidateName.Trim();
        var message = $"{safeCandidate}: status changed to {label} for {job.Title}.";
        await _notificationEventDispatcher.NotifyUsersAsync(
            job.TenantId,
            new[] { candidateUserId.Value },
            "MosaicTalent.ApplicationStatusChanged",
            message,
            NotificationSeverity.Info,
            $"/app/jobs/{job.Id}",
            "Application status updated",
            message);
    }

    private async Task NotifyCandidateAssessmentReceivedAsync(JobAssessment assessment, Job job)
    {
        var candidateUserId = await ResolveAssessmentCandidateUserIdAsync(assessment);
        if (!candidateUserId.HasValue || candidateUserId.Value <= 0)
        {
            return;
        }

        var message = $"Your assessment for {job.Title} was received and reviewed.";
        await _notificationEventDispatcher.NotifyUsersAsync(
            assessment.TenantId,
            new[] { candidateUserId.Value },
            "MosaicTalent.AssessmentReviewedForCandidate",
            message,
            NotificationSeverity.Success,
            $"/app/jobs/{job.Id}",
            "Assessment reviewed",
            message);
    }

    private static string DefaultStarterCode(string workMode, int order, Job job, JobAssessment assessment)
    {
        var mode = (workMode ?? "fullstack").ToLowerInvariant();
        var role = SafeTrim(job?.Title);
        var shortRole = string.IsNullOrWhiteSpace(role) ? "candidate task" : role;
        var assessmentPrompt = SafeTrim(assessment?.Prompt);
        var focus = string.IsNullOrWhiteSpace(assessmentPrompt)
            ? "Implement the requested flow with clear validation and error handling."
            : assessmentPrompt.Split('\n').FirstOrDefault(x => !string.IsNullOrWhiteSpace(x)) ?? "Implement the requested flow.";
        if (mode == "backend")
        {
            var endpoint = BuildEndpointHints(job, mode).FirstOrDefault() ?? "GET /api/...";
            return
                $"// Role context: {shortRole}\n" +
                $"// Focus: {focus}\n" +
                "export async function handleRequest(input: unknown) {\n" +
                $"  // Implement endpoint contract for: {endpoint}\n" +
                "  return { ok: true, data: null };\n" +
                "}\n";
        }

        if (mode == "frontend" || order == 1)
        {
            return
                "import React from \"react\";\n\n" +
                "export default function App() {\n" +
                $"  return <div>Build the {shortRole} user flow with loading/error/success states.</div>;\n" +
                "}\n";
        }

        return
            $"// Role context: {shortRole}\n" +
            "export async function handleFlow() {\n" +
            $"  // Implement integration flow for: {focus}\n" +
            "}\n";
    }

    private static List<LeetPromptProblem> ParseLeetPromptProblems(string contextJson)
    {
        if (string.IsNullOrWhiteSpace(contextJson))
        {
            return new List<LeetPromptProblem>();
        }

        try
        {
            var root = JsonNode.Parse(contextJson)?.AsObject();
            var problemsNode = root?["problems"];
            if (problemsNode == null)
            {
                return new List<LeetPromptProblem>();
            }

            var parsed = problemsNode.Deserialize<List<LeetPromptProblem>>(new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
            }) ?? new List<LeetPromptProblem>();
            return parsed
                .Where(x => !string.IsNullOrWhiteSpace(x.Id) && !string.IsNullOrWhiteSpace(x.Title))
                .OrderBy(x => x.Order)
                .ToList();
        }
        catch
        {
            return new List<LeetPromptProblem>();
        }
    }

    private static string UpsertLeetPromptProblemsIntoContext(string contextJson, List<LeetPromptProblem> problems)
    {
        JsonObject root;
        try
        {
            root = JsonNode.Parse(string.IsNullOrWhiteSpace(contextJson) ? "{}" : contextJson)?.AsObject() ?? new JsonObject();
        }
        catch
        {
            root = new JsonObject();
        }

        root["problems"] = JsonSerializer.SerializeToNode(problems);
        return root.ToJsonString();
    }

    private static LeetPromptSubmission ParseLeetPromptSubmission(string submissionText, string assessmentContextJson = null)
    {
        if (string.IsNullOrWhiteSpace(submissionText))
        {
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(submissionText);
            if (doc.RootElement.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            var contextProblems = ParseLeetPromptProblems(assessmentContextJson)
                .Where(x => !string.IsNullOrWhiteSpace(x.Id))
                .GroupBy(x => x.Id, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);
            var submission = new LeetPromptSubmission();
            if (doc.RootElement.TryGetProperty("problems", out var problemsNode) && problemsNode.ValueKind == JsonValueKind.Array)
            {
                foreach (var node in problemsNode.EnumerateArray())
                {
                    if (node.ValueKind != JsonValueKind.Object)
                    {
                        continue;
                    }

                    var problemId = node.TryGetProperty("problemId", out var idNode) ? idNode.GetString() ?? string.Empty : string.Empty;
                    contextProblems.TryGetValue(problemId, out var contextProblem);
                    var files = ParseSubmissionFiles(node);
                    var code = node.TryGetProperty("code", out var codeNode) ? codeNode.GetString() ?? string.Empty : string.Empty;
                    if (string.IsNullOrWhiteSpace(code) && files.Count > 0)
                    {
                        code = JoinSubmissionFiles(files);
                    }

                    var problem = new LeetPromptSubmissionProblem
                    {
                        ProblemId = string.IsNullOrWhiteSpace(problemId) ? $"problem-{submission.Problems.Count + 1}" : problemId,
                        Title = node.TryGetProperty("title", out var titleNode)
                            ? titleNode.GetString() ?? string.Empty
                            : contextProblem?.Title ?? string.Empty,
                        Description = node.TryGetProperty("description", out var descriptionNode)
                            ? descriptionNode.GetString() ?? string.Empty
                            : contextProblem?.Description ?? string.Empty,
                        Language = node.TryGetProperty("language", out var languageNode)
                            ? languageNode.GetString() ?? string.Empty
                            : contextProblem?.Language ?? string.Empty,
                        Code = code,
                        Files = files,
                        PassedPublic = node.TryGetProperty("passedPublic", out var passedNode) && passedNode.TryGetInt32(out var passed) ? Math.Max(0, passed) : 0,
                        TotalPublic = node.TryGetProperty("totalPublic", out var totalNode) && totalNode.TryGetInt32(out var total) ? Math.Max(0, total) : 0,
                        PromptAttempts = ParsePromptAttempts(node),
                    };
                    submission.Problems.Add(problem);
                }
            }
            else
            {
                // Workspace-style payload fallback.
                if (doc.RootElement.TryGetProperty("workspaceByProblem", out var workspaceNode) &&
                    workspaceNode.ValueKind == JsonValueKind.Object)
                {
                    foreach (var workspaceProperty in workspaceNode.EnumerateObject())
                    {
                        if (workspaceProperty.Value.ValueKind != JsonValueKind.Object)
                        {
                            continue;
                        }

                        var problemId = workspaceProperty.Name;
                        contextProblems.TryGetValue(problemId, out var contextProblem);
                        var files = ParseSubmissionFiles(workspaceProperty.Value);
                        var code = files.Count > 0 ? JoinSubmissionFiles(files) : string.Empty;

                        submission.Problems.Add(new LeetPromptSubmissionProblem
                        {
                            ProblemId = problemId,
                            Title = contextProblem?.Title ?? string.Empty,
                            Description = contextProblem?.Description ?? string.Empty,
                            Language = contextProblem?.Language ?? string.Empty,
                            Code = code,
                            Files = files,
                            PassedPublic = 0,
                            TotalPublic = 0,
                            PromptAttempts = ParsePromptAttempts(workspaceProperty.Value),
                        });
                    }
                }

                if (submission.Problems.Count == 0)
                {
                    var promptAttempts = ParsePromptAttemptsFromRoot(doc.RootElement);
                    var code = doc.RootElement.TryGetProperty("mainFlowCode", out var codeNode)
                        ? codeNode.GetString() ?? string.Empty
                        : doc.RootElement.TryGetProperty("submission", out var submissionNode)
                            ? submissionNode.GetString() ?? string.Empty
                            : string.Empty;
                    submission.Problems.Add(new LeetPromptSubmissionProblem
                    {
                        ProblemId = "workspace",
                        Title = "Workspace submission",
                        Description = string.Empty,
                        Language = string.Empty,
                        Code = code,
                        Files = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
                        PassedPublic = 0,
                        TotalPublic = 0,
                        PromptAttempts = promptAttempts,
                    });
                }
            }

            return submission.Problems.Count == 0 ? null : submission;
        }
        catch
        {
            return null;
        }
    }

    private static Dictionary<string, string> ParseSubmissionFiles(JsonElement node)
    {
        var files = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (!node.TryGetProperty("files", out var filesNode))
        {
            return files;
        }

        if (filesNode.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in filesNode.EnumerateObject())
            {
                var path = property.Name?.Trim();
                if (string.IsNullOrWhiteSpace(path))
                {
                    continue;
                }

                var content = property.Value.ValueKind == JsonValueKind.String
                    ? property.Value.GetString() ?? string.Empty
                    : property.Value.ToString();
                if (string.IsNullOrWhiteSpace(content))
                {
                    continue;
                }

                files[path] = content;
            }

            return files;
        }

        if (filesNode.ValueKind != JsonValueKind.Array)
        {
            return files;
        }

        foreach (var item in filesNode.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            var path = item.TryGetProperty("path", out var pathNode) ? pathNode.GetString()?.Trim() : string.Empty;
            if (string.IsNullOrWhiteSpace(path))
            {
                continue;
            }

            var content = item.TryGetProperty("content", out var contentNode)
                ? contentNode.GetString() ?? string.Empty
                : string.Empty;
            if (string.IsNullOrWhiteSpace(content))
            {
                continue;
            }

            files[path] = content;
        }

        return files;
    }

    private static string JoinSubmissionFiles(Dictionary<string, string> files)
    {
        if (files == null || files.Count == 0)
        {
            return string.Empty;
        }

        var builder = new StringBuilder();
        foreach (var entry in files.OrderBy(x => x.Key, StringComparer.OrdinalIgnoreCase))
        {
            if (builder.Length > 0)
            {
                builder.AppendLine();
                builder.AppendLine();
            }

            builder.Append("// FILE: ").AppendLine(entry.Key);
            builder.Append(entry.Value ?? string.Empty);
        }

        return builder.ToString();
    }

    private static List<LeetPromptPromptAttempt> ParsePromptAttemptsFromRoot(JsonElement root)
    {
        var output = new List<LeetPromptPromptAttempt>();
        if (!root.TryGetProperty("promptAttempts", out var attemptsNode) || attemptsNode.ValueKind != JsonValueKind.Array)
        {
            return output;
        }

        foreach (var attempt in attemptsNode.EnumerateArray())
        {
            if (attempt.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            output.Add(new LeetPromptPromptAttempt
            {
                Prompt = attempt.TryGetProperty("prompt", out var promptNode) ? promptNode.GetString() ?? string.Empty : string.Empty,
                Response = attempt.TryGetProperty("response", out var responseNode) ? responseNode.GetString() ?? string.Empty : string.Empty,
                PromptTokens = attempt.TryGetProperty("promptTokens", out var pNode) && pNode.TryGetInt32(out var p) ? Math.Max(0, p) : 0,
                CompletionTokens = attempt.TryGetProperty("completionTokens", out var cNode) && cNode.TryGetInt32(out var c) ? Math.Max(0, c) : 0,
                TotalTokens = attempt.TryGetProperty("totalTokens", out var tNode) && tNode.TryGetInt32(out var t) ? Math.Max(0, t) : 0,
                Accepted = attempt.TryGetProperty("accepted", out var aNode) && aNode.ValueKind == JsonValueKind.True,
            });
        }

        return output;
    }

    private static List<LeetPromptPromptAttempt> ParsePromptAttempts(JsonElement node)
    {
        var output = new List<LeetPromptPromptAttempt>();
        if (!node.TryGetProperty("promptAttempts", out var attemptsNode) || attemptsNode.ValueKind != JsonValueKind.Array)
        {
            return output;
        }

        foreach (var attempt in attemptsNode.EnumerateArray())
        {
            if (attempt.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            output.Add(new LeetPromptPromptAttempt
            {
                Prompt = attempt.TryGetProperty("prompt", out var promptNode) ? promptNode.GetString() ?? string.Empty : string.Empty,
                Response = attempt.TryGetProperty("response", out var responseNode) ? responseNode.GetString() ?? string.Empty : string.Empty,
                PromptTokens = attempt.TryGetProperty("promptTokens", out var pNode) && pNode.TryGetInt32(out var p) ? Math.Max(0, p) : 0,
                CompletionTokens = attempt.TryGetProperty("completionTokens", out var cNode) && cNode.TryGetInt32(out var c) ? Math.Max(0, c) : 0,
                TotalTokens = attempt.TryGetProperty("totalTokens", out var tNode) && tNode.TryGetInt32(out var t) ? Math.Max(0, t) : 0,
                Accepted = attempt.TryGetProperty("accepted", out var aNode) && aNode.ValueKind == JsonValueKind.True,
            });
        }

        return output;
    }

    private static double ComputePromptQualityScore(LeetPromptSubmission submission)
    {
        var attempts = submission?.Problems?.SelectMany(x => x.PromptAttempts ?? new List<LeetPromptPromptAttempt>()).ToList()
            ?? new List<LeetPromptPromptAttempt>();
        if (attempts.Count == 0)
        {
            return 55;
        }

        var acceptedRatio = attempts.Count(x => x.Accepted) / (double)attempts.Count;
        var avgPromptLen = attempts.Average(x => (x.Prompt ?? string.Empty).Trim().Length);
        var avgResponseLen = attempts.Average(x => (x.Response ?? string.Empty).Trim().Length);
        var concisePromptScore = Math.Min(100d, Math.Max(0d, (avgPromptLen / 220d) * 100d));
        var responseSignalScore = Math.Min(100d, Math.Max(0d, (avgResponseLen / 500d) * 100d));

        return ClampScore(
            (acceptedRatio * 55d) +
            (concisePromptScore * 25d / 100d) +
            (responseSignalScore * 20d / 100d));
    }

    private static double ComputeTokenEfficiencyScore(LeetPromptSubmission submission)
    {
        if (submission?.Problems == null || submission.Problems.Count == 0)
        {
            return 60;
        }

        var attempts = submission.Problems.SelectMany(x => x.PromptAttempts ?? new List<LeetPromptPromptAttempt>()).ToList();
        if (attempts.Count == 0)
        {
            return 60;
        }

        var totalTokens = attempts.Sum(x => x.TotalTokens > 0 ? x.TotalTokens : (x.PromptTokens + x.CompletionTokens));
        var avgTokensPerProblem = totalTokens / Math.Max(1d, submission.Problems.Count);
        var attemptsPerProblem = attempts.Count / Math.Max(1d, submission.Problems.Count);

        var tokenPenalty = avgTokensPerProblem <= 700 ? 0 : Math.Min(70d, ((avgTokensPerProblem - 700d) / 1300d) * 70d);
        var attemptPenalty = attemptsPerProblem <= 2 ? 0 : Math.Min(25d, (attemptsPerProblem - 2d) * 8d);

        return ClampScore(100d - tokenPenalty - attemptPenalty);
    }

    private static double ComputeCodeQualityScore(LeetPromptSubmission submission)
    {
        if (submission?.Problems == null || submission.Problems.Count == 0)
        {
            return 40;
        }

        var scores = new List<double>();
        foreach (var problem in submission.Problems)
        {
            var code = (problem.Code ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(code))
            {
                scores.Add(0);
                continue;
            }

            var score = 40d;
            if (code.Contains("function solve", StringComparison.OrdinalIgnoreCase) ||
                code.Contains("const solve", StringComparison.OrdinalIgnoreCase) ||
                code.Contains("def solve", StringComparison.OrdinalIgnoreCase))
            {
                score += 20;
            }
            if (code.Contains("if", StringComparison.OrdinalIgnoreCase) || code.Contains("switch", StringComparison.OrdinalIgnoreCase))
            {
                score += 10;
            }
            if (code.Contains("for", StringComparison.OrdinalIgnoreCase) || code.Contains("while", StringComparison.OrdinalIgnoreCase))
            {
                score += 10;
            }
            if (code.Contains("//", StringComparison.OrdinalIgnoreCase) || code.Contains("/*", StringComparison.OrdinalIgnoreCase))
            {
                score += 8;
            }
            if (code.Length >= 120 && code.Length <= 4000)
            {
                score += 12;
            }
            if (code.Contains("eval(", StringComparison.OrdinalIgnoreCase) || code.Contains("new Function(", StringComparison.OrdinalIgnoreCase))
            {
                score -= 35;
            }
            if (code.Length < 40)
            {
                score -= 20;
            }

            scores.Add(ClampScore(score));
        }

        return scores.Count == 0 ? 40 : ClampScore(scores.Average());
    }

    private static AssessmentEvaluation MergeExecutionScoreIntoEvaluation(AssessmentEvaluation baseEvaluation, LeetPromptSubmission submission)
    {
        if (submission?.Problems == null || submission.Problems.Count == 0)
        {
            return baseEvaluation;
        }

        var ratios = submission.Problems
            .Where(x => x.TotalPublic > 0)
            .Select(x => (double)x.PassedPublic / x.TotalPublic)
            .ToList();
        var executionScore = ratios.Count == 0 ? ClampScore(baseEvaluation.Score) : ClampScore(ratios.Average() * 100d);
        var promptScore = ComputePromptQualityScore(submission);
        var tokenScore = ComputeTokenEfficiencyScore(submission);
        var codeQualityScore = ComputeCodeQualityScore(submission);
        var combinedScore = ClampScore(
            (executionScore * 0.50) +
            (promptScore * 0.20) +
            (tokenScore * 0.15) +
            (codeQualityScore * 0.15));
        var merged = new AssessmentEvaluation
        {
            Score = combinedScore,
            Verdict = combinedScore >= 80 ? "Strong" : combinedScore >= 60 ? "Good" : "Needs improvement",
            Summary =
                $"LeetPrompt score {combinedScore:0.#}% " +
                $"(tests {executionScore:0.#}%, prompts {promptScore:0.#}%, token efficiency {tokenScore:0.#}%, code quality {codeQualityScore:0.#}%).",
            Strengths = new List<string>(baseEvaluation.Strengths),
            Weaknesses = new List<string>(baseEvaluation.Weaknesses),
            Tips = new List<string>(baseEvaluation.Tips),
            TestScore = executionScore,
            PromptScore = promptScore,
            TokenEfficiencyScore = tokenScore,
            CodeQualityScore = codeQualityScore,
        };
        merged.Strengths.Insert(0, $"Solved {submission.Problems.Sum(x => x.PassedPublic)} public tests out of {submission.Problems.Sum(x => x.TotalPublic)}.");
        if (executionScore < 70)
        {
            merged.Weaknesses.Insert(0, "Public test pass-rate is below target.");
            merged.Tips.Insert(0, "Re-run failing public tests and handle edge cases before final submission.");
        }

        return merged;
    }

    private static string BuildLeetPromptSummaryForAi(LeetPromptSubmission submission)
    {
        if (submission?.Problems == null || submission.Problems.Count == 0)
        {
            return "No runnable problem summary provided.";
        }

        var summary = submission.Problems
            .Take(6)
            .Select(problem =>
            {
                var label = !string.IsNullOrWhiteSpace(problem.Title) ? problem.Title : problem.ProblemId;
                var testSummary = problem.TotalPublic > 0
                    ? $"{problem.PassedPublic}/{problem.TotalPublic}"
                    : "n/a";
                var fileSummary = problem.Files == null || problem.Files.Count == 0
                    ? "files:none"
                    : $"files:{string.Join("|", problem.Files.Keys.Take(5))}";
                return $"{label} [{problem.ProblemId}] tests:{testSummary} {fileSummary}";
            })
            .ToList();
        return string.Join("; ", summary);
    }

    private static string BuildLeetPromptTaskEvidenceForAi(LeetPromptSubmission submission)
    {
        if (submission?.Problems == null || submission.Problems.Count == 0)
        {
            return "No task evidence available.";
        }

        var builder = new StringBuilder();
        foreach (var problem in submission.Problems.Take(4))
        {
            var label = !string.IsNullOrWhiteSpace(problem.Title) ? problem.Title : problem.ProblemId;
            builder.Append("Task: ").AppendLine(label);
            if (!string.IsNullOrWhiteSpace(problem.Description))
            {
                builder.Append("Task brief: ").AppendLine(TruncateForPrompt(problem.Description, 280));
            }

            if (problem.Files != null && problem.Files.Count > 0)
            {
                foreach (var file in problem.Files.Take(4))
                {
                    builder.Append("File: ").AppendLine(file.Key);
                    builder.AppendLine(TruncateForPrompt(file.Value, 500));
                }
            }
            else if (!string.IsNullOrWhiteSpace(problem.Code))
            {
                builder.AppendLine("Code:");
                builder.AppendLine(TruncateForPrompt(problem.Code, 700));
            }

            builder.AppendLine("---");
        }

        return builder.ToString();
    }

    private static string TruncateForPrompt(string value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value.Trim();
        if (normalized.Length <= maxLength)
        {
            return normalized;
        }

        return normalized.Substring(0, maxLength) + "...";
    }

    private async Task<PromptAssistCompletion> TryCompleteAssessmentPromptWithUsage(
        Job job,
        JobAssessment assessment,
        LeetPromptProblem problem,
        string userPrompt)
    {
        var fallbackResponse =
            "I can help you refine this. Break your approach into: parsing input, core algorithm, and return format. " +
            "Then validate with the provided public tests and edge cases.";
        var fallbackPromptTokens = EstimateTokenCount(userPrompt);
        var fallbackCompletionTokens = EstimateTokenCount(fallbackResponse);

        var apiKey = (_configuration["Groq:ApiKey"] ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return new PromptAssistCompletion
            {
                Response = fallbackResponse,
                PromptTokens = fallbackPromptTokens,
                CompletionTokens = fallbackCompletionTokens,
                TotalTokens = fallbackPromptTokens + fallbackCompletionTokens,
            };
        }

        var model = (_configuration["Groq:Model"] ?? "llama-3.3-70b-versatile").Trim();
        var systemPrompt =
            "You are a coding assistant for LeetPrompt assessments. " +
            "Provide concise guidance, pseudocode, and test-oriented reasoning. " +
            "Do not mention hidden tests. Return JSON only with keys: response.";
        var contextualPrompt =
            $"Role: {job.Title}\n" +
            $"Assessment candidate: {assessment.CandidateName}\n" +
            $"Problem title: {problem.Title}\n" +
            $"Problem description: {problem.Description}\n" +
            $"Starter code: {problem.StarterCode}\n" +
            $"User prompt: {userPrompt}\n";

        var payload = new
        {
            model,
            temperature = 0.2,
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = contextualPrompt },
            },
            response_format = new { type = "json_object" },
        };

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(20);
            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");

            using var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                return new PromptAssistCompletion
                {
                    Response = fallbackResponse,
                    PromptTokens = fallbackPromptTokens,
                    CompletionTokens = fallbackCompletionTokens,
                    TotalTokens = fallbackPromptTokens + fallbackCompletionTokens,
                };
            }

            var body = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(body);

            var content = fallbackResponse;
            if (document.RootElement.TryGetProperty("choices", out var choices) &&
                choices.ValueKind == JsonValueKind.Array &&
                choices.GetArrayLength() > 0)
            {
                var raw = choices[0].GetProperty("message").GetProperty("content").GetString();
                if (!string.IsNullOrWhiteSpace(raw))
                {
                    try
                    {
                        using var contentDoc = JsonDocument.Parse(raw);
                        if (contentDoc.RootElement.TryGetProperty("response", out var responseNode))
                        {
                            var parsed = SafeTrim(responseNode.GetString());
                            if (!string.IsNullOrWhiteSpace(parsed))
                            {
                                content = parsed;
                            }
                        }
                    }
                    catch
                    {
                        content = SafeTrim(raw);
                    }
                }
            }

            var promptTokens = fallbackPromptTokens;
            var completionTokens = EstimateTokenCount(content);
            var totalTokens = promptTokens + completionTokens;
            if (document.RootElement.TryGetProperty("usage", out var usageNode) && usageNode.ValueKind == JsonValueKind.Object)
            {
                if (usageNode.TryGetProperty("prompt_tokens", out var promptNode) && promptNode.TryGetInt32(out var p))
                {
                    promptTokens = Math.Max(0, p);
                }
                if (usageNode.TryGetProperty("completion_tokens", out var completionNode) && completionNode.TryGetInt32(out var c))
                {
                    completionTokens = Math.Max(0, c);
                }
                if (usageNode.TryGetProperty("total_tokens", out var totalNode) && totalNode.TryGetInt32(out var t))
                {
                    totalTokens = Math.Max(0, t);
                }
                else
                {
                    totalTokens = promptTokens + completionTokens;
                }
            }

            return new PromptAssistCompletion
            {
                Response = string.IsNullOrWhiteSpace(content) ? fallbackResponse : content,
                PromptTokens = promptTokens,
                CompletionTokens = completionTokens,
                TotalTokens = totalTokens,
            };
        }
        catch
        {
            return new PromptAssistCompletion
            {
                Response = fallbackResponse,
                PromptTokens = fallbackPromptTokens,
                CompletionTokens = fallbackCompletionTokens,
                TotalTokens = fallbackPromptTokens + fallbackCompletionTokens,
            };
        }
    }

    private static int EstimateTokenCount(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return 0;
        }

        var chars = text.Length;
        return Math.Max(1, (int)Math.Ceiling(chars / 4d));
    }

    private JobAssessmentDto MapAssessmentDto(JobAssessment assessment, Job job, Company company, AssessmentEvaluation evaluated = null)
    {
        var workbenchConfig = ParseWorkbenchConfig(assessment.ContextJson, job);
        var result = ParseAssessmentEvaluationResult(assessment.AssessmentResultJson);
        var strengths = evaluated?.Strengths ?? result.Strengths;
        var weaknesses = evaluated?.Weaknesses ?? result.Weaknesses;
        var tips = evaluated?.Tips ?? result.Tips;
        var problems = ParseLeetPromptProblems(assessment.ContextJson)
            .OrderBy(x => x.Order)
            .Select(x => new JobAssessmentProblemDto
            {
                Id = x.Id,
                Title = x.Title,
                Description = x.Description,
                Language = x.Language,
                StarterCode = x.StarterCode,
                MaxScore = x.MaxScore,
                Order = x.Order,
                PublicTests = (x.PublicTests ?? new List<LeetPromptTestCase>())
                    .Select(t => new JobAssessmentTestCaseDto
                    {
                        Input = t.Input,
                        ExpectedOutput = t.ExpectedOutput,
                        Hint = t.Hint,
                    }).ToList(),
            }).ToList();

        return new JobAssessmentDto
        {
            Id = assessment.Id,
            JobId = assessment.JobId,
            JobApplicationId = assessment.JobApplicationId,
            PublicJobApplicationId = assessment.PublicJobApplicationId,
            CandidateName = assessment.CandidateName ?? string.Empty,
            CandidateEmail = assessment.CandidateEmail ?? string.Empty,
            JobTitle = job?.Title ?? string.Empty,
            CompanyName = company?.Name ?? string.Empty,
            Prompt = assessment.Prompt ?? string.Empty,
            Instructions = assessment.Instructions ?? string.Empty,
            Status = ToAssessmentStatusLabel(assessment.Status),
            SubmissionText = assessment.SubmissionText ?? string.Empty,
            SubmissionGithubRepo = assessment.SubmissionGithubRepo ?? string.Empty,
            Score = assessment.Score,
            Verdict = string.IsNullOrWhiteSpace(assessment.Verdict) ? result.Verdict : assessment.Verdict,
            Strengths = strengths,
            Weaknesses = weaknesses,
            Tips = tips,
            SubmittedAt = assessment.SubmittedAt,
            Problems = problems,
            WorkMode = workbenchConfig.WorkMode,
            EndpointHints = workbenchConfig.EndpointHints,
            InteractiveQuestions = workbenchConfig.InteractiveQuestions,
        };
    }

    private static AssessmentProposalDto BuildProposalFromPrompt(string prompt, string response)
    {
        var lowerPrompt = (prompt ?? string.Empty).ToLowerInvariant();
        var hallucinates =
            lowerPrompt.Contains("add extra") ||
            lowerPrompt.Contains("new feature") ||
            lowerPrompt.Contains("optional feature");

        var patch = hallucinates
            ? "// Suggested (scope-risk): add social auth and analytics tracking."
            : $"// Suggested patch from AI\n// {SafeTrim(response).Substring(0, Math.Min(240, SafeTrim(response).Length))}";

        return new AssessmentProposalDto
        {
            Title = hallucinates ? "Additional feature suggestion" : "Ticket-aligned change",
            Patch = patch,
            IsHallucinationRisk = hallucinates,
        };
    }

    private static string ResolveWorkMode(Job job)
    {
        var signal = $"{job?.Title} {job?.Description} {job?.TechnicalAssessmentPrompt} {job?.BehaviouralAssessmentPrompt}".ToLowerInvariant();
        var hasFrontend = signal.Contains("frontend") || signal.Contains("react") || signal.Contains("next");
        var hasBackend = signal.Contains("backend") || signal.Contains("api") || signal.Contains("endpoint") || signal.Contains("service");
        if (hasFrontend && hasBackend)
        {
            return "fullstack";
        }

        if (hasBackend)
        {
            return "backend";
        }

        return "frontend";
    }

    private static List<string> BuildEndpointHints(Job job, string workMode)
    {
        var normalizedMode = NormalizeWorkMode(workMode);
        if (normalizedMode == "frontend")
        {
            return new List<string>();
        }

        var corpus = $"{job?.Description} {job?.TechnicalAssessmentPrompt} {job?.BehaviouralAssessmentPrompt}";
        if (string.IsNullOrWhiteSpace(corpus))
        {
            return new List<string>();
        }

        var output = new List<string>();
        var endpointRegex = new Regex(@"(?:GET|POST|PUT|PATCH|DELETE)\s+(/[a-zA-Z0-9\-_/{}/]+)|(/api/[a-zA-Z0-9\-_/{}/]+)", RegexOptions.IgnoreCase);
        var matches = endpointRegex.Matches(corpus);
        foreach (Match match in matches)
        {
            var value = match.Groups[1].Success ? match.Groups[1].Value : match.Groups[2].Value;
            value = SafeTrim(value);
            if (string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            if (!output.Any(x => string.Equals(x, value, StringComparison.OrdinalIgnoreCase)))
            {
                output.Add(value);
            }
        }

        return output.Take(8).ToList();
    }

    private static List<string> BuildInteractiveQuestions(string workMode, Job job = null, ApplicationAssessment aiAssessment = null)
    {
        var questions = new List<string>();
        questions.AddRange(ExtractQuestionsFromText(job?.TechnicalAssessmentPrompt));
        questions.AddRange(ExtractQuestionsFromText(job?.BehaviouralAssessmentPrompt));
        questions.AddRange(ExtractQuestionsFromText(job?.Description));

        if (!string.Equals(workMode, "frontend", StringComparison.OrdinalIgnoreCase))
        {
            var endpoint = BuildEndpointHints(job, workMode).FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(endpoint))
            {
                questions.Add($"How would you version and protect contract changes for `{endpoint}`?");
            }
        }

        if (questions.Count == 0)
        {
            var role = SafeTrim(job?.Title);
            var primarySkill = aiAssessment?.ExtractedSkills?.FirstOrDefault(x => !string.IsNullOrWhiteSpace(x));
            var fallback = string.IsNullOrWhiteSpace(primarySkill)
                ? $"What was your highest-impact implementation decision for {(string.IsNullOrWhiteSpace(role) ? "this role" : role)}?"
                : $"How did {primarySkill} influence your final implementation decision?";
            questions.Add(fallback);
        }

        return questions
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(8)
            .ToList();
    }

    private static List<string> ExtractQuestionsFromText(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return new List<string>();
        }

        var output = new List<string>();
        var normalized = text.Replace("\r", "\n");
        var blocks = normalized.Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries);
        foreach (var block in blocks)
        {
            var sentences = block.Split(new[] { '.', '!', '?' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var sentence in sentences)
            {
                var value = sentence.Trim();
                if (string.IsNullOrWhiteSpace(value))
                {
                    continue;
                }

                var originalHasQuestion = block.Contains("?", StringComparison.Ordinal);
                if (originalHasQuestion)
                {
                    output.Add(value.EndsWith("?") ? value : $"{value}?");
                }
            }
        }

        return output;

    }

    private static List<string> DeriveStrongLanguages(ApplicationAssessment aiAssessment)
    {
        var output = new List<string>();
        var known = new[]
        {
            "typescript", "javascript", "c#", "csharp", "python", "java", "go", "kotlin", "swift",
            "php", "ruby", "rust", "scala", "sql", "dart", "tsx", "jsx",
        };

        var pool = new List<string>();
        if (aiAssessment?.ExtractedSkills != null)
        {
            pool.AddRange(aiAssessment.ExtractedSkills);
        }

        if (aiAssessment?.Projects != null)
        {
            foreach (var project in aiAssessment.Projects)
            {
                if (project?.Technologies != null)
                {
                    pool.AddRange(project.Technologies);
                }
            }
        }

        foreach (var raw in pool)
        {
            var value = (raw ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            var normalized = value.ToLowerInvariant();
            var matched = known.FirstOrDefault(lang => normalized == lang || normalized.Contains(lang));
            if (string.IsNullOrWhiteSpace(matched))
            {
                continue;
            }

            var display = matched == "csharp" ? "c#" : matched;
            if (!output.Any(x => string.Equals(x, display, StringComparison.OrdinalIgnoreCase)))
            {
                output.Add(display);
            }
        }

        return output.Take(8).ToList();
    }

    private static string BuildAssessmentGenerationSeed(Job job, string candidateName, string candidateEmail)
    {
        var baseSeed =
            $"{job?.Id}|{job?.Title}|{candidateName}|{candidateEmail}|{DateTime.UtcNow:yyyyMMddHHmmssfff}|{Guid.NewGuid():N}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(baseSeed))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private static List<string> KeepOnlyRelevantEndpointHints(List<string> endpointHints, string prompt, string instructions)
    {
        var safe = (endpointHints ?? new List<string>())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => SafeTrim(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(8)
            .ToList();

        if (safe.Count == 0)
        {
            return safe;
        }

        var signal = $"{prompt} {instructions}".ToLowerInvariant();
        var needsApiHints = signal.Contains("api") ||
                            signal.Contains("endpoint") ||
                            signal.Contains("backend") ||
                            signal.Contains("integration") ||
                            signal.Contains("service contract");
        if (!needsApiHints)
        {
            return new List<string>();
        }

        return safe;
    }

    private static AssessmentWorkbenchConfig ParseWorkbenchConfig(string contextJson, Job job)
    {
        var fallbackMode = ResolveWorkMode(job);
        var fallback = new AssessmentWorkbenchConfig
        {
            WorkMode = fallbackMode,
            EndpointHints = BuildEndpointHints(job, fallbackMode),
            InteractiveQuestions = BuildInteractiveQuestions(fallbackMode, job),
        };

        if (string.IsNullOrWhiteSpace(contextJson))
        {
            return fallback;
        }

        try
        {
            using var doc = JsonDocument.Parse(contextJson);
            if (doc.RootElement.ValueKind != JsonValueKind.Object)
            {
                return fallback;
            }

            var mode = doc.RootElement.TryGetProperty("workMode", out var modeNode)
                ? SafeTrim(modeNode.GetString())
                : fallback.WorkMode;
            var endpoints = doc.RootElement.TryGetProperty("endpointHints", out var endpointNode)
                ? ReadStringArray(endpointNode)
                : fallback.EndpointHints;
            var questions = doc.RootElement.TryGetProperty("interactiveQuestions", out var questionsNode)
                ? ReadStringArray(questionsNode)
                : fallback.InteractiveQuestions;

            return new AssessmentWorkbenchConfig
            {
                WorkMode = string.IsNullOrWhiteSpace(mode) ? fallback.WorkMode : mode.ToLowerInvariant(),
                EndpointHints = endpoints.Count == 0 ? fallback.EndpointHints : endpoints,
                InteractiveQuestions = questions.Count == 0 ? fallback.InteractiveQuestions : questions,
            };
        }
        catch
        {
            return fallback;
        }
    }

    private static AssessmentEvaluation ParseAssessmentEvaluationResult(string assessmentResultJson)
    {
        var fallback = new AssessmentEvaluation
        {
            Score = 0,
            Verdict = string.Empty,
            Summary = string.Empty,
            Strengths = new List<string>(),
            Weaknesses = new List<string>(),
            Tips = new List<string>(),
        };

        if (string.IsNullOrWhiteSpace(assessmentResultJson))
        {
            return fallback;
        }

        try
        {
            using var doc = JsonDocument.Parse(assessmentResultJson);
            if (doc.RootElement.ValueKind != JsonValueKind.Object)
            {
                return fallback;
            }

            return new AssessmentEvaluation
            {
                Score = doc.RootElement.TryGetProperty("score", out var scoreNode) && scoreNode.TryGetDouble(out var score) ? ClampScore(score) : 0,
                Verdict = doc.RootElement.TryGetProperty("verdict", out var verdictNode) ? verdictNode.GetString() ?? string.Empty : string.Empty,
                Summary = doc.RootElement.TryGetProperty("summary", out var summaryNode) ? summaryNode.GetString() ?? string.Empty : string.Empty,
                Strengths = doc.RootElement.TryGetProperty("strengths", out var strengthsNode) ? ReadStringArray(strengthsNode) : new List<string>(),
                Weaknesses = doc.RootElement.TryGetProperty("weaknesses", out var weaknessesNode) ? ReadStringArray(weaknessesNode) : new List<string>(),
                Tips = doc.RootElement.TryGetProperty("tips", out var tipsNode) ? ReadStringArray(tipsNode) : new List<string>(),
            };
        }
        catch
        {
            return fallback;
        }
    }

    private static HashSet<ApplicationStatus> BuildStatusFilter(List<int> values)
    {
        var output = new HashSet<ApplicationStatus>();
        if (values == null || values.Count == 0)
        {
            return output;
        }

        foreach (var value in values)
        {
            try
            {
                output.Add(ParseApplicationStatus(value));
            }
            catch
            {
                // ignore invalid filters
            }
        }

        return output;
    }

    private static EmploymentType ParseEmploymentType(int value)
    {
        return value switch
        {
            0 => EmploymentType.FullTime,
            1 => EmploymentType.PartTime,
            2 => EmploymentType.Contract,
            _ => throw new UserFriendlyException("Invalid employment type."),
        };
    }

    private static ApplicationSource ParseApplicationSource(int value)
    {
        return value switch
        {
            0 => ApplicationSource.LinkedIn,
            1 => ApplicationSource.Facebook,
            2 => ApplicationSource.Referral,
            3 => ApplicationSource.Website,
            4 => ApplicationSource.Google,
            5 => ApplicationSource.Other,
            _ => throw new UserFriendlyException("Invalid application source."),
        };
    }

    private static ApplicationStatus ParseApplicationStatus(int value)
    {
        return value switch
        {
            0 => ApplicationStatus.Applied,
            1 => ApplicationStatus.Shortlisted,
            2 => ApplicationStatus.Interview,
            3 => ApplicationStatus.Rejected,
            4 => ApplicationStatus.Approved,
            5 => ApplicationStatus.Assessment,
            _ => throw new UserFriendlyException("Invalid application status."),
        };
    }

    private static string ToEmploymentTypeLabel(EmploymentType type)
    {
        return type switch
        {
            EmploymentType.FullTime => "full-time",
            EmploymentType.PartTime => "part-time",
            EmploymentType.Contract => "contract",
            _ => "full-time",
        };
    }

    private static string ToSourceLabel(ApplicationSource source)
    {
        return source switch
        {
            ApplicationSource.LinkedIn => "linkedin",
            ApplicationSource.Facebook => "facebook",
            ApplicationSource.Referral => "referral",
            ApplicationSource.Website => "website",
            ApplicationSource.Google => "google",
            ApplicationSource.Other => "other",
            _ => "other",
        };
    }

    private static string ToStatusLabel(ApplicationStatus status)
    {
        return status switch
        {
            ApplicationStatus.Applied => "applied",
            ApplicationStatus.Shortlisted => "shortlisted",
            ApplicationStatus.Assessment => "assessment",
            ApplicationStatus.Interview => "interview",
            ApplicationStatus.Rejected => "rejected",
            ApplicationStatus.Approved => "approved",
            _ => "applied",
        };
    }

    private static string ToAssessmentStatusLabel(AssessmentStatus status)
    {
        return status switch
        {
            AssessmentStatus.Pending => "pending",
            AssessmentStatus.Submitted => "submitted",
            AssessmentStatus.Reviewed => "reviewed",
            _ => "pending",
        };
    }

    private async Task<CompanyJobsPageSettings> TryGetPageSettingsOrNull(int tenantId, Guid companyId)
    {
        try
        {
            return await _jobsPageSettingsRepository.GetAll()
                .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.CompanyId == companyId);
        }
        catch (Exception ex) when (IsMissingRelation(ex))
        {
            return null;
        }
    }

    private static bool IsMissingRelation(Exception exception)
    {
        if (exception == null)
        {
            return false;
        }

        var message = exception.Message ?? string.Empty;
        if (message.Contains("42P01", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("42703", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("relation \"CompanyJobsPageSettings\" does not exist", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("relation \"PublicJobApplications\" does not exist", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("relation \"JobAssessments\" does not exist", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("EmailTemplateSettingsJson", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return exception.InnerException != null && IsMissingRelation(exception.InnerException);
    }

    private async Task<string> TryExtractResumeTextAsync(string resumeReference)
    {
        if (string.IsNullOrWhiteSpace(resumeReference))
        {
            return string.Empty;
        }

        if (!Uri.TryCreate(resumeReference.Trim(), UriKind.Absolute, out var uri))
        {
            return string.Empty;
        }

        if (!uri.Scheme.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            return string.Empty;
        }

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(15);
            using var response = await client.GetAsync(uri);
            if (!response.IsSuccessStatusCode)
            {
                return string.Empty;
            }

            var bytes = await response.Content.ReadAsByteArrayAsync();
            if (bytes.Length == 0)
            {
                return string.Empty;
            }

            var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
            var extension = Path.GetExtension(uri.AbsolutePath).ToLowerInvariant();
            return ExtractTextFromBytes(bytes, contentType, extension);
        }
        catch
        {
            return string.Empty;
        }
    }

    private static string ExtractTextFromBytes(byte[] bytes, string contentType, string extension)
    {
        if (bytes == null || bytes.Length == 0)
        {
            return string.Empty;
        }

        if (extension == ".txt" || contentType.StartsWith("text/", StringComparison.OrdinalIgnoreCase))
        {
            return SafeTrim(DecodeUtf8(bytes));
        }

        if (extension == ".docx" ||
            contentType.Equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document", StringComparison.OrdinalIgnoreCase))
        {
            return SafeTrim(ExtractDocxText(bytes));
        }

        if (extension == ".pdf" || contentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
        {
            return SafeTrim(ExtractPdfText(bytes));
        }

        return SafeTrim(ExtractPdfText(bytes));
    }

    private static string ExtractDocxText(byte[] bytes)
    {
        try
        {
            using var ms = new MemoryStream(bytes);
            using var archive = new ZipArchive(ms, ZipArchiveMode.Read, false);
            var entry = archive.GetEntry("word/document.xml");
            if (entry == null)
            {
                return string.Empty;
            }

            using var stream = entry.Open();
            using var reader = new StreamReader(stream);
            var xml = reader.ReadToEnd();
            var doc = XDocument.Parse(xml);
            var textNodes = doc.Descendants().Where(x => x.Name.LocalName == "t").Select(x => x.Value);
            return string.Join(" ", textNodes);
        }
        catch
        {
            return string.Empty;
        }
    }

    private static string ExtractPdfText(byte[] bytes)
    {
        var fromPdfPig = ExtractPdfTextWithPdfPig(bytes);
        if (!string.IsNullOrWhiteSpace(fromPdfPig))
        {
            return SafeTrim(fromPdfPig);
        }

        return SafeTrim(ExtractPdfLikeText(bytes));
    }

    private static string ExtractPdfTextWithPdfPig(byte[] bytes)
    {
        try
        {
            using var stream = new MemoryStream(bytes);
            using var document = PdfDocument.Open(stream);
            var pages = document.GetPages();
            var lines = pages
                .Select(page => page.Text)
                .Where(text => !string.IsNullOrWhiteSpace(text))
                .Select(text => Regex.Replace(text, @"\s+", " ").Trim())
                .Where(text => text.Length > 1)
                .ToList();
            if (lines.Count == 0)
            {
                return string.Empty;
            }

            return string.Join("\n", lines);
        }
        catch
        {
            return string.Empty;
        }
    }

    private static string ExtractPdfLikeText(byte[] bytes)
    {
        try
        {
            var raw = DecodeLatin1(bytes);
            var matches = Regex.Matches(raw, @"\(([^)]{2,200})\)");
            var parts = matches
                .Cast<Match>()
                .Select(m => m.Groups[1].Value)
                .Where(v => Regex.IsMatch(v, @"[A-Za-z]{2,}"))
                .Take(800)
                .ToList();
            if (parts.Count == 0)
            {
                return string.Empty;
            }

            return string.Join(" ", parts);
        }
        catch
        {
            return string.Empty;
        }
    }

    private async Task<ApplicationAssessment> BuildApplicationAssessmentAsync(
        Job job,
        ApplyToPublicJobInput input,
        string resumeText)
    {
        var fallback = BuildHeuristicAssessment(job, input, resumeText);
        var githubAnalysis = await TryAnalyzeGithubBackgroundAsync(input, resumeText, fallback.GithubRepo);
        fallback = MergeGithubAnalysisIntoAssessment(fallback, githubAnalysis);
        if (!_groqChatService.IsConfigured())
        {
            return fallback;
        }

        var systemPrompt =
            "You are a strict hiring assistant. Return JSON only with keys: " +
            "score (0-100), summary, verdict, strengths (array), weaknesses (array), skills (array), githubRepo, " +
            "projects (array of objects with name, description, technologies array, score), " +
            "experienceHighlights (array), totalExperienceYears (number), " +
            "mosaic (object with technical, problemSolving, collaboration, communication between 0 and 100).";
        var githubContext = BuildGithubAnalysisContextForAi(githubAnalysis);
        var userPrompt =
            $"Job title: {job.Title}\n" +
            $"Job description: {job.Description}\n" +
            $"Job location: {job.Location}\n" +
            $"Technical prompt: {job.TechnicalAssessmentPrompt}\n" +
            $"Behavioural prompt: {job.BehaviouralAssessmentPrompt}\n" +
            $"Applicant full name: {input.FullName}\n" +
            $"Applicant email: {input.Email}\n" +
            $"Applicant responses: {input.ResponsesJson}\n" +
            $"Resume text: {resumeText}\n" +
            $"GitHub analysis: {githubContext}\n" +
            "Evaluate fit and provide concise strengths/weaknesses and a verdict.";

        try
        {
            var response = await _groqChatService.TryCompleteAsync(systemPrompt, userPrompt);
            if (string.IsNullOrWhiteSpace(response))
            {
                return fallback;
            }

            using var doc = JsonDocument.Parse(response);
            var root = doc.RootElement;
            var score = root.TryGetProperty("score", out var scoreNode) ? scoreNode.GetDouble() : fallback.Score;
            var summary = root.TryGetProperty("summary", out var summaryNode) ? summaryNode.GetString() : fallback.Summary;
            var verdict = root.TryGetProperty("verdict", out var verdictNode) ? verdictNode.GetString() : fallback.Verdict;
            var strengths = root.TryGetProperty("strengths", out var strengthsNode) ? ReadStringArray(strengthsNode) : fallback.Strengths;
            var weaknesses = root.TryGetProperty("weaknesses", out var weaknessesNode) ? ReadStringArray(weaknessesNode) : fallback.Weaknesses;
            var skills = root.TryGetProperty("skills", out var skillsNode) ? ReadStringArray(skillsNode) : fallback.ExtractedSkills;
            var githubRepo = root.TryGetProperty("githubRepo", out var repoNode) ? repoNode.GetString() : fallback.GithubRepo;
            var projects = root.TryGetProperty("projects", out var projectsNode) ? ReadProjectArray(projectsNode) : fallback.Projects;
            var experienceHighlights = root.TryGetProperty("experienceHighlights", out var experienceNode)
                ? ReadStringArray(experienceNode)
                : fallback.ExperienceHighlights;
            var totalExperienceYears = root.TryGetProperty("totalExperienceYears", out var yearsNode) && yearsNode.TryGetDouble(out var years)
                ? (double?)Math.Max(0, years)
                : fallback.TotalExperienceYears;
            var mosaic = root.TryGetProperty("mosaic", out var mosaicNode) ? ReadMosaicScores(mosaicNode) : fallback.Mosaic;

            var result = new ApplicationAssessment
            {
                Score = ClampScore(score),
                Summary = string.IsNullOrWhiteSpace(summary) ? fallback.Summary : summary.Trim(),
                Verdict = string.IsNullOrWhiteSpace(verdict) ? fallback.Verdict : verdict.Trim(),
                Strengths = strengths.Count == 0 ? fallback.Strengths : strengths.Take(5).ToList(),
                Weaknesses = weaknesses.Count == 0 ? fallback.Weaknesses : weaknesses.Take(5).ToList(),
                ExtractedSkills = skills.Take(12).ToList(),
                GithubRepo = githubRepo ?? string.Empty,
                Projects = projects.Count == 0 ? fallback.Projects : projects.Take(6).ToList(),
                ExperienceHighlights = experienceHighlights.Take(8).ToList(),
                TotalExperienceYears = totalExperienceYears,
                Mosaic = mosaic.Count == 0 ? fallback.Mosaic : mosaic,
            };
            return MergeGithubAnalysisIntoAssessment(result, githubAnalysis);
        }
        catch
        {
            return fallback;
        }
    }

    private static ApplicationAssessment BuildHeuristicAssessment(
        Job job,
        ApplyToPublicJobInput input,
        string resumeText)
    {
        var corpus = $"{job.Title} {job.Description} {job.TechnicalAssessmentPrompt} {job.BehaviouralAssessmentPrompt}".ToLowerInvariant();
        var text = $"{resumeText} {input.ResponsesJson} {input.TechnicalAssessmentAnswer} {input.BehaviouralAssessmentAnswer}".ToLowerInvariant();

        var extractedSkills = ExtractSharedTechnicalTerms(corpus, text);
        var matched = extractedSkills.Count(skill => corpus.Contains(skill, StringComparison.OrdinalIgnoreCase));
        var score = Math.Min(95, 45 + matched * 8 + (text.Length > 500 ? 8 : 0));
        var verdict = score >= 75 ? "Strong match" : score >= 55 ? "Moderate match" : "Needs review";

        return new ApplicationAssessment
        {
            Score = score,
            Summary = $"Automated CV/job alignment indicates a {verdict.ToLowerInvariant()} based on extracted skills and provided answers.",
            Verdict = verdict,
            Strengths = new List<string>
            {
                extractedSkills.Count > 0 ? $"Detected skills: {string.Join(", ", extractedSkills.Take(6))}" : "Provided application details are complete.",
                "Submitted resume and assessment responses for evaluation."
            },
            Weaknesses = new List<string>
            {
                extractedSkills.Count < 3 ? "Limited clearly extracted technical skills from CV." : "Some required skills may need deeper validation interview.",
                string.IsNullOrWhiteSpace(resumeText) ? "Resume text extraction was limited; verify CV manually." : "Needs manual validation of claims against portfolio."
            },
            ExtractedSkills = extractedSkills,
            GithubRepo = ExtractGithubRepo(text),
            Projects = BuildFallbackProjects(text, extractedSkills),
            ExperienceHighlights = BuildFallbackExperienceHighlights(text),
            TotalExperienceYears = EstimateExperienceYears(text),
            Mosaic = BuildFallbackMosaic(score),
        };
    }

    private ApplicationAssessment MergeGithubAnalysisIntoAssessment(
        ApplicationAssessment assessment,
        GithubBackgroundAnalysis analysis)
    {
        if (assessment == null || analysis == null)
        {
            return assessment;
        }

        if (!string.IsNullOrWhiteSpace(analysis.PrimaryRepositoryUrl) &&
            string.IsNullOrWhiteSpace(assessment.GithubRepo))
        {
            assessment.GithubRepo = analysis.PrimaryRepositoryUrl;
        }

        assessment.GithubUsername = analysis.Username ?? string.Empty;
        assessment.GithubProfileSummary = analysis.ProfileSummary ?? string.Empty;
        assessment.DocumentationScore = analysis.DocumentationScore;
        assessment.DocumentationNotes = analysis.DocumentationNotes?.Take(8).ToList() ?? new List<string>();
        assessment.AnalysisConfidence = analysis.Confidence ?? "low";
        assessment.AnalysisSourceStatus = analysis.SourceStatus != null
            ? new Dictionary<string, string>(analysis.SourceStatus, StringComparer.OrdinalIgnoreCase)
            : new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        var mergedSkills = new List<string>(assessment.ExtractedSkills ?? new List<string>());
        foreach (var language in analysis.TopLanguages ?? new List<string>())
        {
            if (string.IsNullOrWhiteSpace(language))
            {
                continue;
            }

            if (!mergedSkills.Any(x => string.Equals(x, language, StringComparison.OrdinalIgnoreCase)))
            {
                mergedSkills.Add(language);
            }
        }
        assessment.ExtractedSkills = mergedSkills.Take(12).ToList();

        if ((analysis.PublicRepoCount ?? 0) > 0)
        {
            var footprint = $"GitHub footprint: {analysis.PublicRepoCount} public repos, {analysis.TotalStars} total stars.";
            if (!assessment.Strengths.Any(x => x.Contains("GitHub footprint", StringComparison.OrdinalIgnoreCase)))
            {
                assessment.Strengths.Insert(0, footprint);
            }
        }

        if (analysis.DocumentationScore.HasValue)
        {
            var docScore = analysis.DocumentationScore.Value;
            if (docScore >= 75)
            {
                assessment.Strengths.Insert(0, $"README/documentation quality is strong ({docScore:0.#}%).");
            }
            else if (docScore < 50)
            {
                assessment.Weaknesses.Insert(0, $"README/documentation quality needs improvement ({docScore:0.#}%).");
            }
        }

        assessment.Strengths = assessment.Strengths
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(8)
            .ToList();
        assessment.Weaknesses = assessment.Weaknesses
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(8)
            .ToList();

        if (!string.IsNullOrWhiteSpace(analysis.ProfileSummary))
        {
            var summaryLead = SafeTrim(analysis.ProfileSummary);
            if (summaryLead.Length > 260)
            {
                summaryLead = summaryLead.Substring(0, 260) + "...";
            }

            if (!string.IsNullOrWhiteSpace(summaryLead) &&
                !assessment.Summary.Contains("GitHub", StringComparison.OrdinalIgnoreCase))
            {
                assessment.Summary = $"{assessment.Summary} GitHub signal: {summaryLead}";
            }
        }

        return assessment;
    }

    private async Task<GithubBackgroundAnalysis> TryAnalyzeGithubBackgroundAsync(
        ApplyToPublicJobInput input,
        string resumeText,
        string fallbackRepoUrl)
    {
        var analysis = new GithubBackgroundAnalysis
        {
            Username = string.Empty,
            ProfileSummary = string.Empty,
            PrimaryRepositoryUrl = fallbackRepoUrl ?? string.Empty,
            Confidence = "low",
            DocumentationScore = null,
            DocumentationNotes = new List<string>(),
            TopLanguages = new List<string>(),
            SourceStatus = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["githubUser"] = "skipped:no-username",
                ["githubRepos"] = "skipped:no-username",
                ["profileSummary"] = "skipped:no-username",
                ["readmeAnalysis"] = "skipped:no-username",
            },
        };

        var probeText =
            $"{input?.ResponsesJson}\n{input?.TechnicalAssessmentAnswer}\n{input?.BehaviouralAssessmentAnswer}\n{resumeText}\n{fallbackRepoUrl}";
        var username = ResolveGithubUsernameFromText(probeText);
        if (string.IsNullOrWhiteSpace(username))
        {
            analysis.DocumentationNotes.Add("GitHub username not found; used resume/response heuristics only.");
            return analysis;
        }

        analysis.Username = username;
        analysis.SourceStatus["githubUser"] = "pending";
        analysis.SourceStatus["githubRepos"] = "pending";
        analysis.SourceStatus["profileSummary"] = "pending";
        analysis.SourceStatus["readmeAnalysis"] = "pending";

        var userProfile = await TryGetGithubUserProfileAsync(username);
        analysis.SourceStatus["githubUser"] = userProfile.Status;
        if (userProfile.Payload != null)
        {
            analysis.PublicRepoCount = userProfile.Payload.PublicRepoCount;
            analysis.TotalFollowers = userProfile.Payload.Followers;
            analysis.TotalFollowing = userProfile.Payload.Following;
        }

        var repoResponse = await TryGetGithubRepositoriesAsync(username);
        analysis.SourceStatus["githubRepos"] = repoResponse.Status;
        var repos = repoResponse.Payload ?? new List<GithubRepositorySnapshot>();
        if (repos.Count > 0)
        {
            analysis.TotalStars = repos.Sum(x => Math.Max(0, x.Stars));
            analysis.PrimaryRepositoryUrl = string.IsNullOrWhiteSpace(analysis.PrimaryRepositoryUrl)
                ? repos.OrderByDescending(x => x.Stars).ThenByDescending(x => x.UpdatedAt).Select(x => x.HtmlUrl).FirstOrDefault() ?? string.Empty
                : analysis.PrimaryRepositoryUrl;
            analysis.TopLanguages = repos
                .Where(x => !string.IsNullOrWhiteSpace(x.Language))
                .GroupBy(x => x.Language, StringComparer.OrdinalIgnoreCase)
                .OrderByDescending(x => x.Count())
                .ThenByDescending(x => x.Sum(y => y.Stars))
                .Select(x => x.Key)
                .Take(8)
                .ToList();
        }

        var profileSummary = await TryGetGithubProfileSummaryAsync(username);
        analysis.SourceStatus["profileSummary"] = profileSummary.Status;
        if (!string.IsNullOrWhiteSpace(profileSummary.Payload))
        {
            analysis.ProfileSummary = profileSummary.Payload;
        }

        var readmeScores = new List<double>();
        var readmeNotes = new List<string>();
        var readmeCandidates = repos
            .Where(x => !x.IsFork && !x.IsArchived)
            .OrderByDescending(x => x.Stars)
            .ThenByDescending(x => x.UpdatedAt)
            .Take(4)
            .ToList();
        var readmeStatuses = new List<string>();
        foreach (var repo in readmeCandidates)
        {
            var readmeResponse = await TryGetRepositoryReadmeAsync(username, repo.Name);
            readmeStatuses.Add(readmeResponse.Status);
            if (string.IsNullOrWhiteSpace(readmeResponse.Payload))
            {
                continue;
            }

            var evaluation = EvaluateReadmeStrength(readmeResponse.Payload, repo);
            readmeScores.Add(evaluation.Score);
            readmeNotes.AddRange(evaluation.Notes);
        }

        if (readmeScores.Count > 0)
        {
            analysis.DocumentationScore = ClampScore(readmeScores.Average());
            analysis.DocumentationNotes = readmeNotes
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(10)
                .ToList();
            analysis.SourceStatus["readmeAnalysis"] = $"ok:{readmeScores.Count}/{readmeCandidates.Count}";
        }
        else
        {
            analysis.DocumentationScore = EstimateMetadataDocumentationScore(repos);
            analysis.DocumentationNotes = new List<string>
            {
                "README content unavailable or inaccessible; documentation score estimated from repository metadata.",
            };
            analysis.SourceStatus["readmeAnalysis"] = readmeStatuses.Count == 0
                ? "skipped:no-repositories"
                : $"fallback:metadata ({string.Join(",", readmeStatuses.Take(3))})";
        }

        var sourceSuccessCount = analysis.SourceStatus.Values.Count(x => x.StartsWith("ok", StringComparison.OrdinalIgnoreCase));
        analysis.Confidence = sourceSuccessCount >= 3
            ? "high"
            : sourceSuccessCount >= 2
                ? "medium"
                : "low";

        if (analysis.TopLanguages.Count == 0 && repos.Count > 0)
        {
            analysis.DocumentationNotes.Add("Repository languages were sparse; confidence reduced.");
            if (analysis.Confidence == "high")
            {
                analysis.Confidence = "medium";
            }
        }

        return analysis;
    }

    private static string BuildGithubAnalysisContextForAi(GithubBackgroundAnalysis analysis)
    {
        if (analysis == null || string.IsNullOrWhiteSpace(analysis.Username))
        {
            return "No GitHub profile was resolved.";
        }

        var sourceStatus = analysis.SourceStatus == null || analysis.SourceStatus.Count == 0
            ? "n/a"
            : string.Join(", ", analysis.SourceStatus.Select(x => $"{x.Key}:{x.Value}"));
        var topLanguages = analysis.TopLanguages == null || analysis.TopLanguages.Count == 0
            ? "none"
            : string.Join(", ", analysis.TopLanguages);
        var notes = analysis.DocumentationNotes == null || analysis.DocumentationNotes.Count == 0
            ? "none"
            : string.Join("; ", analysis.DocumentationNotes.Take(4));
        var profileSummary = string.IsNullOrWhiteSpace(analysis.ProfileSummary)
            ? "none"
            : TruncateForPrompt(analysis.ProfileSummary, 500);

        return
            $"username={analysis.Username}; repos={analysis.PublicRepoCount?.ToString() ?? "unknown"}; " +
            $"stars={analysis.TotalStars}; followers={analysis.TotalFollowers?.ToString() ?? "unknown"}; " +
            $"topLanguages={topLanguages}; docsScore={(analysis.DocumentationScore?.ToString("0.#") ?? "n/a")}; " +
            $"confidence={analysis.Confidence}; sourceStatus={sourceStatus}; notes={notes}; profileSummary={profileSummary}";
    }

    private static string ResolveGithubUsernameFromText(string text)
    {
        var usernameFromRepo = ParseGithubUsernameFromRepositoryUrl(text);
        if (!string.IsNullOrWhiteSpace(usernameFromRepo))
        {
            return usernameFromRepo;
        }

        var profilePattern = new Regex(@"https?:\/\/github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)(?:\/)?", RegexOptions.IgnoreCase);
        var profileMatch = profilePattern.Match(text ?? string.Empty);
        if (profileMatch.Success)
        {
            return profileMatch.Groups[1].Value;
        }

        return string.Empty;
    }

    private static string ParseGithubUsernameFromRepositoryUrl(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        var repoPattern = new Regex(@"https?:\/\/github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)\/([A-Za-z0-9_.-]+)", RegexOptions.IgnoreCase);
        var match = repoPattern.Match(text);
        return match.Success ? match.Groups[1].Value : string.Empty;
    }

    private async Task<GithubApiResult<GithubUserProfileSnapshot>> TryGetGithubUserProfileAsync(string username)
    {
        var url = $"https://api.github.com/users/{username}";
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(12);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("MosaicTalent/1.0");
            client.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");

            using var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                return new GithubApiResult<GithubUserProfileSnapshot>
                {
                    Status = $"failed:{(int)response.StatusCode}",
                };
            }

            var body = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.ValueKind != JsonValueKind.Object)
            {
                return new GithubApiResult<GithubUserProfileSnapshot> { Status = "failed:invalid-json" };
            }

            return new GithubApiResult<GithubUserProfileSnapshot>
            {
                Status = "ok",
                Payload = new GithubUserProfileSnapshot
                {
                    PublicRepoCount = doc.RootElement.TryGetProperty("public_repos", out var reposNode) && reposNode.TryGetInt32(out var repos) ? Math.Max(0, repos) : 0,
                    Followers = doc.RootElement.TryGetProperty("followers", out var followersNode) && followersNode.TryGetInt32(out var followers) ? Math.Max(0, followers) : 0,
                    Following = doc.RootElement.TryGetProperty("following", out var followingNode) && followingNode.TryGetInt32(out var following) ? Math.Max(0, following) : 0,
                    Bio = doc.RootElement.TryGetProperty("bio", out var bioNode) ? SafeTrim(bioNode.GetString()) : string.Empty,
                },
            };
        }
        catch
        {
            return new GithubApiResult<GithubUserProfileSnapshot> { Status = "failed:exception" };
        }
    }

    private async Task<GithubApiResult<List<GithubRepositorySnapshot>>> TryGetGithubRepositoriesAsync(string username)
    {
        var url = $"https://api.github.com/users/{username}/repos?per_page=100&sort=updated";
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(14);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("MosaicTalent/1.0");
            client.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");

            using var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                return new GithubApiResult<List<GithubRepositorySnapshot>>
                {
                    Status = $"failed:{(int)response.StatusCode}",
                    Payload = new List<GithubRepositorySnapshot>(),
                };
            }

            var body = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.ValueKind != JsonValueKind.Array)
            {
                return new GithubApiResult<List<GithubRepositorySnapshot>>
                {
                    Status = "failed:invalid-json",
                    Payload = new List<GithubRepositorySnapshot>(),
                };
            }

            var repos = new List<GithubRepositorySnapshot>();
            foreach (var node in doc.RootElement.EnumerateArray())
            {
                if (node.ValueKind != JsonValueKind.Object)
                {
                    continue;
                }

                var name = node.TryGetProperty("name", out var nameNode) ? SafeTrim(nameNode.GetString()) : string.Empty;
                if (string.IsNullOrWhiteSpace(name))
                {
                    continue;
                }

                var updatedAt = DateTime.MinValue;
                if (node.TryGetProperty("updated_at", out var updatedNode) &&
                    DateTime.TryParse(updatedNode.GetString(), out var parsedUpdated))
                {
                    updatedAt = parsedUpdated;
                }

                repos.Add(new GithubRepositorySnapshot
                {
                    Name = name,
                    Description = node.TryGetProperty("description", out var descNode) ? SafeTrim(descNode.GetString()) : string.Empty,
                    HtmlUrl = node.TryGetProperty("html_url", out var htmlNode) ? SafeTrim(htmlNode.GetString()) : string.Empty,
                    Language = node.TryGetProperty("language", out var languageNode) ? SafeTrim(languageNode.GetString()) : string.Empty,
                    Stars = node.TryGetProperty("stargazers_count", out var starsNode) && starsNode.TryGetInt32(out var stars) ? Math.Max(0, stars) : 0,
                    Forks = node.TryGetProperty("forks_count", out var forksNode) && forksNode.TryGetInt32(out var forks) ? Math.Max(0, forks) : 0,
                    Size = node.TryGetProperty("size", out var sizeNode) && sizeNode.TryGetInt32(out var size) ? Math.Max(0, size) : 0,
                    IsFork = node.TryGetProperty("fork", out var forkNode) && forkNode.ValueKind == JsonValueKind.True,
                    IsArchived = node.TryGetProperty("archived", out var archivedNode) && archivedNode.ValueKind == JsonValueKind.True,
                    UpdatedAt = updatedAt,
                });
            }

            return new GithubApiResult<List<GithubRepositorySnapshot>>
            {
                Status = "ok",
                Payload = repos,
            };
        }
        catch
        {
            return new GithubApiResult<List<GithubRepositorySnapshot>>
            {
                Status = "failed:exception",
                Payload = new List<GithubRepositorySnapshot>(),
            };
        }
    }

    private async Task<GithubApiResult<string>> TryGetGithubProfileSummaryAsync(string username)
    {
        var url = $"https://profile-summary-for-github.com/api/user/{username}";
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            using var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                return new GithubApiResult<string> { Status = $"failed:{(int)response.StatusCode}", Payload = string.Empty };
            }

            var body = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrWhiteSpace(body))
            {
                return new GithubApiResult<string> { Status = "failed:empty", Payload = string.Empty };
            }

            var summary = ExtractGithubProfileSummary(body);
            return new GithubApiResult<string>
            {
                Status = string.IsNullOrWhiteSpace(summary) ? "failed:no-summary" : "ok",
                Payload = summary ?? string.Empty,
            };
        }
        catch
        {
            return new GithubApiResult<string> { Status = "failed:exception", Payload = string.Empty };
        }
    }

    private static string ExtractGithubProfileSummary(string payload)
    {
        if (string.IsNullOrWhiteSpace(payload))
        {
            return string.Empty;
        }

        try
        {
            using var doc = JsonDocument.Parse(payload);
            if (doc.RootElement.ValueKind == JsonValueKind.String)
            {
                return SafeTrim(doc.RootElement.GetString());
            }

            if (doc.RootElement.ValueKind == JsonValueKind.Object)
            {
                var keys = new[] { "summary", "profile", "introduction", "bio", "content", "message" };
                foreach (var key in keys)
                {
                    if (doc.RootElement.TryGetProperty(key, out var node) &&
                        node.ValueKind == JsonValueKind.String)
                    {
                        var text = SafeTrim(node.GetString());
                        if (!string.IsNullOrWhiteSpace(text))
                        {
                            return text;
                        }
                    }
                }

                var chunks = new List<string>();
                foreach (var property in doc.RootElement.EnumerateObject())
                {
                    if (property.Value.ValueKind == JsonValueKind.String)
                    {
                        var text = SafeTrim(property.Value.GetString());
                        if (!string.IsNullOrWhiteSpace(text))
                        {
                            chunks.Add(text);
                        }
                    }
                }

                if (chunks.Count > 0)
                {
                    return string.Join(" ", chunks).Trim();
                }
            }
        }
        catch
        {
            return SafeTrim(payload);
        }

        return SafeTrim(payload);
    }

    private async Task<GithubApiResult<string>> TryGetRepositoryReadmeAsync(string username, string repositoryName)
    {
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(repositoryName))
        {
            return new GithubApiResult<string> { Status = "skipped:invalid-args", Payload = string.Empty };
        }

        var url = $"https://api.github.com/repos/{username}/{repositoryName}/readme";
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(12);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("MosaicTalent/1.0");
            client.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");

            using var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                return new GithubApiResult<string> { Status = $"failed:{(int)response.StatusCode}", Payload = string.Empty };
            }

            var body = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.ValueKind != JsonValueKind.Object)
            {
                return new GithubApiResult<string> { Status = "failed:invalid-json", Payload = string.Empty };
            }

            var encoding = doc.RootElement.TryGetProperty("encoding", out var encodingNode) ? encodingNode.GetString() ?? string.Empty : string.Empty;
            var content = doc.RootElement.TryGetProperty("content", out var contentNode) ? contentNode.GetString() ?? string.Empty : string.Empty;
            if (string.Equals(encoding, "base64", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(content))
            {
                try
                {
                    var normalized = content.Replace("\n", string.Empty).Replace("\r", string.Empty);
                    var bytes = Convert.FromBase64String(normalized);
                    var readme = DecodeUtf8(bytes);
                    return new GithubApiResult<string> { Status = "ok", Payload = readme };
                }
                catch
                {
                    // ignore decode issue and continue fallback
                }
            }

            if (!string.IsNullOrWhiteSpace(content))
            {
                return new GithubApiResult<string> { Status = "ok", Payload = content };
            }

            if (doc.RootElement.TryGetProperty("download_url", out var downloadNode))
            {
                var downloadUrl = SafeTrim(downloadNode.GetString());
                if (!string.IsNullOrWhiteSpace(downloadUrl))
                {
                    var raw = await client.GetStringAsync(downloadUrl);
                    return new GithubApiResult<string> { Status = "ok", Payload = raw };
                }
            }

            return new GithubApiResult<string> { Status = "failed:no-content", Payload = string.Empty };
        }
        catch
        {
            return new GithubApiResult<string> { Status = "failed:exception", Payload = string.Empty };
        }
    }

    private static GithubReadmeEvaluation EvaluateReadmeStrength(string readme, GithubRepositorySnapshot repository)
    {
        if (string.IsNullOrWhiteSpace(readme))
        {
            return new GithubReadmeEvaluation
            {
                Score = EstimateMetadataDocumentationScore(new List<GithubRepositorySnapshot> { repository }),
                Notes = new List<string> { $"{repository.Name}: README unavailable, used repository metadata fallback." },
            };
        }

        var text = readme.Trim();
        var lower = text.ToLowerInvariant();
        var score = 20d;
        var notes = new List<string>();

        if (Regex.IsMatch(text, @"^\s*#\s+", RegexOptions.Multiline))
        {
            score += 10;
        }

        if (lower.Contains("installation") || lower.Contains("setup") || lower.Contains("getting started") || lower.Contains("quick start"))
        {
            score += 18;
            notes.Add($"{repository.Name}: includes setup instructions.");
        }

        if (lower.Contains("usage") || lower.Contains("how to use") || lower.Contains("run "))
        {
            score += 14;
        }

        if (lower.Contains("architecture") || lower.Contains("design") || lower.Contains("structure"))
        {
            score += 12;
            notes.Add($"{repository.Name}: explains architecture/design.");
        }

        if (lower.Contains("api") || lower.Contains("endpoint") || lower.Contains("swagger") || lower.Contains("graphql"))
        {
            score += 12;
            notes.Add($"{repository.Name}: documents API/endpoints.");
        }

        if (lower.Contains("example") || lower.Contains("sample") || lower.Contains("demo") || lower.Contains("screenshot"))
        {
            score += 8;
        }

        if (lower.Contains("test") || lower.Contains("unit") || lower.Contains("integration"))
        {
            score += 8;
        }

        if (lower.Contains("contributing") || lower.Contains("license"))
        {
            score += 6;
        }

        if (text.Length >= 900)
        {
            score += 8;
        }
        else if (text.Length >= 450)
        {
            score += 4;
        }

        if (!notes.Any())
        {
            notes.Add($"{repository.Name}: README present but limited structural guidance.");
        }

        return new GithubReadmeEvaluation
        {
            Score = ClampScore(score),
            Notes = notes,
        };
    }

    private static double EstimateMetadataDocumentationScore(List<GithubRepositorySnapshot> repositories)
    {
        if (repositories == null || repositories.Count == 0)
        {
            return 35;
        }

        var considered = repositories.Take(6).ToList();
        var hasDescriptions = considered.Count(x => !string.IsNullOrWhiteSpace(x.Description));
        var hasLanguages = considered.Count(x => !string.IsNullOrWhiteSpace(x.Language));
        var recentlyUpdated = considered.Count(x => x.UpdatedAt > DateTime.UtcNow.AddMonths(-6));
        var score =
            30d +
            (hasDescriptions / (double)considered.Count) * 25d +
            (hasLanguages / (double)considered.Count) * 20d +
            (recentlyUpdated / (double)considered.Count) * 15d;

        return ClampScore(score);
    }

    private static List<string> BuildFallbackExperienceHighlights(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return new List<string>();
        }

        var normalized = text.Replace("\r", "\n");
        var lines = normalized
            .Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(x => x.Trim())
            .Where(x => x.Length >= 25)
            .Take(200)
            .ToList();
        var keywords = new[] { "experience", "worked", "built", "led", "developed", "engineer", "project", "role", "responsible" };
        return lines
            .Where(line => keywords.Any(k => line.Contains(k, StringComparison.OrdinalIgnoreCase)))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(6)
            .ToList();
    }

    private static double? EstimateExperienceYears(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        var matches = Regex.Matches(text.ToLowerInvariant(), @"(\d{1,2}(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)");
        var years = matches
            .Cast<Match>()
            .Select(m => double.TryParse(m.Groups[1].Value, out var value) ? value : -1)
            .Where(v => v >= 0)
            .DefaultIfEmpty(-1)
            .Max();
        return years < 0 ? null : Math.Min(50, years);
    }

    private static List<string> ExtractSharedTechnicalTerms(string corpus, string text)
    {
        var corpusTokens = TokenizeTechnicalTerms(corpus).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var textTokens = TokenizeTechnicalTerms(text);
        var output = new List<string>();
        foreach (var token in textTokens)
        {
            if (!corpusTokens.Contains(token))
            {
                continue;
            }

            if (!output.Any(x => string.Equals(x, token, StringComparison.OrdinalIgnoreCase)))
            {
                output.Add(token);
            }
        }

        return output.Take(12).ToList();
    }

    private static IEnumerable<string> TokenizeTechnicalTerms(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return Array.Empty<string>();
        }

        var stopwords = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "and", "the", "for", "with", "this", "that", "from", "your", "have", "has", "will", "into", "about", "build",
            "using", "used", "need", "must", "task", "ticket", "role", "team", "work", "code", "flow", "user", "data",
            "system", "service", "application", "candidate", "project", "required", "requirements"
        };

        var matches = Regex.Matches(input.ToLowerInvariant(), @"[a-z0-9\.\+#-]{2,}");
        var output = new List<string>();
        foreach (Match match in matches)
        {
            var value = match.Value.Trim();
            if (value.Length < 2 || value.Length > 32 || stopwords.Contains(value))
            {
                continue;
            }

            var hasSignal = value.Contains('.') || value.Contains('#') || value.Contains('+') || value.Contains('-') || value.Any(char.IsDigit);
            if (!hasSignal && value.Length < 4)
            {
                continue;
            }

            output.Add(value);
        }

        return output;
    }

    private static string MergeResponsesWithAssessment(string inputResponsesJson, ApplicationAssessment assessment, string resumeText)
    {
        var root = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(inputResponsesJson))
        {
            try
            {
                using var doc = JsonDocument.Parse(inputResponsesJson);
                if (doc.RootElement.ValueKind == JsonValueKind.Object)
                {
                    foreach (var property in doc.RootElement.EnumerateObject())
                    {
                        if (property.Value.ValueKind == JsonValueKind.String)
                        {
                            root[property.Name] = property.Value.GetString();
                        }
                    }
                }
            }
            catch
            {
                // Ignore malformed payload and continue with AI block only.
            }
        }

        root["__ai_score"] = assessment.Score;
        root["__ai_verdict"] = assessment.Verdict;
        root["__ai_strengths"] = assessment.Strengths;
        root["__ai_weaknesses"] = assessment.Weaknesses;
        root["__ai_skills"] = assessment.ExtractedSkills;
        root["__ai_github_repo"] = assessment.GithubRepo;
        root["__ai_github_username"] = assessment.GithubUsername;
        root["__ai_github_profile_summary"] = assessment.GithubProfileSummary;
        root["__ai_documentation_score"] = assessment.DocumentationScore;
        root["__ai_documentation_notes"] = assessment.DocumentationNotes;
        root["__ai_analysis_confidence"] = assessment.AnalysisConfidence;
        root["__ai_analysis_source_status"] = assessment.AnalysisSourceStatus;
        root["__ai_projects"] = assessment.Projects;
        root["__ai_experience_highlights"] = assessment.ExperienceHighlights;
        root["__ai_total_experience_years"] = assessment.TotalExperienceYears;
        root["__ai_mosaic"] = assessment.Mosaic;
        root["__resume_extracted"] = !string.IsNullOrWhiteSpace(resumeText);

        return JsonSerializer.Serialize(root);
    }

    private static ApplicationAssessment ParseAssessmentFromApplicationResponse(string responseJson)
    {
        var fallback = new ApplicationAssessment
        {
            Score = 0,
            Summary = string.Empty,
            Verdict = string.Empty,
            Strengths = new List<string>(),
            Weaknesses = new List<string>(),
            ExtractedSkills = new List<string>(),
            GithubRepo = string.Empty,
            GithubUsername = string.Empty,
            GithubProfileSummary = string.Empty,
            DocumentationScore = null,
            DocumentationNotes = new List<string>(),
            AnalysisConfidence = "low",
            AnalysisSourceStatus = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
            ExperienceHighlights = new List<string>(),
            TotalExperienceYears = null,
        };

        if (string.IsNullOrWhiteSpace(responseJson))
        {
            return fallback;
        }

        try
        {
            using var doc = JsonDocument.Parse(responseJson);
            if (doc.RootElement.ValueKind != JsonValueKind.Object)
            {
                return fallback;
            }

            fallback.Verdict = doc.RootElement.TryGetProperty("__ai_verdict", out var verdictNode) ? verdictNode.GetString() ?? string.Empty : string.Empty;
            fallback.Strengths = doc.RootElement.TryGetProperty("__ai_strengths", out var strengthsNode) ? ReadStringArray(strengthsNode) : new List<string>();
            fallback.Weaknesses = doc.RootElement.TryGetProperty("__ai_weaknesses", out var weaknessesNode) ? ReadStringArray(weaknessesNode) : new List<string>();
            fallback.ExtractedSkills = doc.RootElement.TryGetProperty("__ai_skills", out var skillsNode) ? ReadStringArray(skillsNode) : new List<string>();
            fallback.GithubRepo = doc.RootElement.TryGetProperty("__ai_github_repo", out var repoNode) ? repoNode.GetString() ?? string.Empty : string.Empty;
            fallback.GithubUsername = doc.RootElement.TryGetProperty("__ai_github_username", out var userNode) ? userNode.GetString() ?? string.Empty : string.Empty;
            fallback.GithubProfileSummary = doc.RootElement.TryGetProperty("__ai_github_profile_summary", out var profileNode) ? profileNode.GetString() ?? string.Empty : string.Empty;
            fallback.DocumentationScore = doc.RootElement.TryGetProperty("__ai_documentation_score", out var docScoreNode) && docScoreNode.TryGetDouble(out var parsedDocScore)
                ? ClampScore(parsedDocScore)
                : null;
            fallback.DocumentationNotes = doc.RootElement.TryGetProperty("__ai_documentation_notes", out var docNotesNode) ? ReadStringArray(docNotesNode) : new List<string>();
            fallback.AnalysisConfidence = doc.RootElement.TryGetProperty("__ai_analysis_confidence", out var confidenceNode)
                ? confidenceNode.GetString() ?? "low"
                : "low";
            fallback.AnalysisSourceStatus = doc.RootElement.TryGetProperty("__ai_analysis_source_status", out var sourceNode)
                ? ReadStringMap(sourceNode)
                : new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            fallback.Projects = doc.RootElement.TryGetProperty("__ai_projects", out var projectsNode) ? ReadProjectArray(projectsNode) : new List<ProjectInsight>();
            fallback.ExperienceHighlights = doc.RootElement.TryGetProperty("__ai_experience_highlights", out var experienceNode) ? ReadStringArray(experienceNode) : new List<string>();
            fallback.TotalExperienceYears = doc.RootElement.TryGetProperty("__ai_total_experience_years", out var yearsNode) && yearsNode.TryGetDouble(out var years) ? Math.Max(0, years) : null;
            fallback.Mosaic = doc.RootElement.TryGetProperty("__ai_mosaic", out var mosaicNode) ? ReadMosaicScores(mosaicNode) : new Dictionary<string, double>();
            return fallback;
        }
        catch
        {
            return fallback;
        }
    }

    private static List<string> ReadStringArray(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Array)
        {
            return new List<string>();
        }

        return element.EnumerateArray()
            .Where(x => x.ValueKind == JsonValueKind.String)
            .Select(x => x.GetString())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .ToList();
    }

    private static Dictionary<string, string> ReadStringMap(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }

        var output = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var property in element.EnumerateObject())
        {
            if (property.Value.ValueKind != JsonValueKind.String)
            {
                continue;
            }

            var value = property.Value.GetString() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            output[property.Name] = value.Trim();
        }

        return output;
    }

    private static List<ProjectInsight> ReadProjectArray(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Array)
        {
            return new List<ProjectInsight>();
        }

        var output = new List<ProjectInsight>();
        foreach (var node in element.EnumerateArray())
        {
            if (node.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            var name = node.TryGetProperty("name", out var nameNode) ? SafeTrim(nameNode.GetString()) : string.Empty;
            if (string.IsNullOrWhiteSpace(name))
            {
                continue;
            }

            var description = node.TryGetProperty("description", out var descNode) ? SafeTrim(descNode.GetString()) : string.Empty;
            var score = node.TryGetProperty("score", out var scoreNode) && scoreNode.TryGetDouble(out var parsedScore)
                ? ClampScore(parsedScore)
                : 0;
            var technologies = node.TryGetProperty("technologies", out var techNode) ? ReadStringArray(techNode).Take(8).ToList() : new List<string>();

            output.Add(new ProjectInsight
            {
                Name = name,
                Description = description,
                Score = score,
                Technologies = technologies,
            });
        }

        return output;
    }

    private static Dictionary<string, double> ReadMosaicScores(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
        }

        var output = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
        var keys = new[] { "technical", "problemSolving", "collaboration", "communication" };
        foreach (var key in keys)
        {
            if (!element.TryGetProperty(key, out var valueNode))
            {
                continue;
            }

            if (!valueNode.TryGetDouble(out var value))
            {
                continue;
            }

            output[key] = ClampScore(value);
        }

        return output;
    }

    private static List<ProjectInsight> BuildFallbackProjects(string text, List<string> extractedSkills)
    {
        var output = new List<ProjectInsight>();
        var segments = Regex.Split(text ?? string.Empty, @"[\r\n]+|(?<=[.])\s+")
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => SafeTrim(x))
            .Where(x => x.Length > 30)
            .Take(3)
            .ToList();
        var idx = 1;
        foreach (var segment in segments)
        {
            output.Add(new ProjectInsight
            {
                Name = $"CV Project {idx}",
                Description = segment,
                Score = Math.Max(50, 80 - (idx * 5)),
                Technologies = extractedSkills.Take(4).ToList(),
            });
            idx++;
        }

        return output;
    }

    private static Dictionary<string, double> BuildFallbackMosaic(double score)
    {
        return new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase)
        {
            ["technical"] = ClampScore(score),
            ["problemSolving"] = ClampScore(score * 0.96),
            ["collaboration"] = ClampScore(score * 0.92),
            ["communication"] = ClampScore(score * 0.90),
        };
    }

    private static double ClampScore(double score)
    {
        if (double.IsNaN(score) || double.IsInfinity(score))
        {
            return 0;
        }

        return Math.Max(0, Math.Min(100, Math.Round(score, 1)));
    }

    private static string ExtractGithubRepo(string text)
    {
        var match = Regex.Match(text ?? string.Empty, @"https?:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+", RegexOptions.IgnoreCase);
        return match.Success ? match.Value : string.Empty;
    }

    private static string DecodeUtf8(byte[] bytes)
    {
        return System.Text.Encoding.UTF8.GetString(bytes);
    }

    private static string DecodeLatin1(byte[] bytes)
    {
        return System.Text.Encoding.GetEncoding("ISO-8859-1").GetString(bytes);
    }

    private static string SafeTrim(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = Regex.Replace(value, @"\s+", " ").Trim();
        return normalized.Length > 25000 ? normalized.Substring(0, 25000) : normalized;
    }

    private static List<AiProjectDto> ToProjectDtos(List<ProjectInsight> projects)
    {
        if (projects == null || projects.Count == 0)
        {
            return new List<AiProjectDto>();
        }

        return projects.Select(x => new AiProjectDto
        {
            Name = x.Name,
            Description = x.Description,
            Score = x.Score,
            Technologies = x.Technologies ?? new List<string>(),
        }).ToList();
    }

    private static void EnsurePdfResumeReference(string resumeReference)
    {
        if (string.IsNullOrWhiteSpace(resumeReference))
        {
            return;
        }

        var value = resumeReference.Trim();
        if (!value.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            throw new UserFriendlyException("Resume must be uploaded as a PDF file.");
        }
    }

    private sealed class ApplicationAssessment
    {
        public double Score { get; set; }
        public string Summary { get; set; } = string.Empty;
        public string Verdict { get; set; } = string.Empty;
        public List<string> Strengths { get; set; } = new();
        public List<string> Weaknesses { get; set; } = new();
        public List<string> ExtractedSkills { get; set; } = new();
        public string GithubRepo { get; set; } = string.Empty;
        public string GithubUsername { get; set; } = string.Empty;
        public string GithubProfileSummary { get; set; } = string.Empty;
        public double? DocumentationScore { get; set; }
        public List<string> DocumentationNotes { get; set; } = new();
        public string AnalysisConfidence { get; set; } = "low";
        public Dictionary<string, string> AnalysisSourceStatus { get; set; } = new(StringComparer.OrdinalIgnoreCase);
        public List<ProjectInsight> Projects { get; set; } = new();
        public List<string> ExperienceHighlights { get; set; } = new();
        public double? TotalExperienceYears { get; set; }
        public Dictionary<string, double> Mosaic { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    }

    private sealed class ProjectInsight
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double Score { get; set; }
        public List<string> Technologies { get; set; } = new();
    }

    private sealed class GithubBackgroundAnalysis
    {
        public string Username { get; set; } = string.Empty;
        public string PrimaryRepositoryUrl { get; set; } = string.Empty;
        public string ProfileSummary { get; set; } = string.Empty;
        public int? PublicRepoCount { get; set; }
        public int? TotalFollowers { get; set; }
        public int? TotalFollowing { get; set; }
        public int TotalStars { get; set; }
        public List<string> TopLanguages { get; set; } = new();
        public double? DocumentationScore { get; set; }
        public List<string> DocumentationNotes { get; set; } = new();
        public string Confidence { get; set; } = "low";
        public Dictionary<string, string> SourceStatus { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    }

    private sealed class GithubRepositorySnapshot
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string HtmlUrl { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public int Stars { get; set; }
        public int Forks { get; set; }
        public int Size { get; set; }
        public bool IsFork { get; set; }
        public bool IsArchived { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    private sealed class GithubUserProfileSnapshot
    {
        public int PublicRepoCount { get; set; }
        public int Followers { get; set; }
        public int Following { get; set; }
        public string Bio { get; set; } = string.Empty;
    }

    private sealed class GithubApiResult<T>
    {
        public string Status { get; set; } = "failed";
        public T Payload { get; set; }
    }

    private sealed class GithubReadmeEvaluation
    {
        public double Score { get; set; }
        public List<string> Notes { get; set; } = new();
    }

    private sealed class AssessmentWorkbenchConfig
    {
        public string WorkMode { get; set; } = "fullstack";
        public List<string> EndpointHints { get; set; } = new();
        public List<string> InteractiveQuestions { get; set; } = new();
    }

    private sealed class AssessmentBlueprint
    {
        public string Prompt { get; set; } = string.Empty;
        public string Instructions { get; set; } = string.Empty;
        public string WorkMode { get; set; } = "fullstack";
        public List<string> EndpointHints { get; set; } = new();
        public List<string> InteractiveQuestions { get; set; } = new();
        public string GenerationSeed { get; set; } = string.Empty;
    }

    private sealed class AssessmentEvaluation
    {
        public double Score { get; set; }
        public string Verdict { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public List<string> Strengths { get; set; } = new();
        public List<string> Weaknesses { get; set; } = new();
        public List<string> Tips { get; set; } = new();
        public double TestScore { get; set; }
        public double PromptScore { get; set; }
        public double TokenEfficiencyScore { get; set; }
        public double CodeQualityScore { get; set; }
    }

    private sealed class LeetPromptProblem
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Language { get; set; } = "javascript";
        public string StarterCode { get; set; } = string.Empty;
        public double MaxScore { get; set; } = 100;
        public int Order { get; set; }
        public List<LeetPromptTestCase> PublicTests { get; set; } = new();
    }

    private sealed class LeetPromptTestCase
    {
        public string Input { get; set; } = string.Empty;
        public string ExpectedOutput { get; set; } = string.Empty;
        public string Hint { get; set; } = string.Empty;
    }

    private sealed class LeetPromptSubmission
    {
        public List<LeetPromptSubmissionProblem> Problems { get; set; } = new();
    }

    private sealed class LeetPromptSubmissionProblem
    {
        public string ProblemId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public Dictionary<string, string> Files { get; set; } = new(StringComparer.OrdinalIgnoreCase);
        public int PassedPublic { get; set; }
        public int TotalPublic { get; set; }
        public List<LeetPromptPromptAttempt> PromptAttempts { get; set; } = new();
    }

    private sealed class LeetPromptPromptAttempt
    {
        public string Prompt { get; set; } = string.Empty;
        public string Response { get; set; } = string.Empty;
        public int PromptTokens { get; set; }
        public int CompletionTokens { get; set; }
        public int TotalTokens { get; set; }
        public bool Accepted { get; set; }
    }

    private sealed class PromptAssistCompletion
    {
        public string Response { get; set; } = string.Empty;
        public int PromptTokens { get; set; }
        public int CompletionTokens { get; set; }
        public int TotalTokens { get; set; }
    }

    private sealed class EmailTemplateSettings
    {
        public bool ApplicationReceivedEnabled { get; set; } = true;
        public string ApplicationReceivedMode { get; set; } = "manual";
        public string ApplicationReceivedSubject { get; set; } = "Application received for {jobTitle}";
        public string ApplicationReceivedBody { get; set; } =
            "Hi {candidateName},\n\nThanks for applying to {companyName} for {jobTitle}. We received your application.\n\nComplete your assessment here:\n{assessmentLink}\n\nRegards,\n{companyName} Team";
    }
}
