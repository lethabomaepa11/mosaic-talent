using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Companies;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Services.AiService;
using MosaicTalent.Services.CompanyJobService.DTO;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net.Http;
using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace MosaicTalent.Services.CompanyJobService;

[AbpAuthorize]
public class CompanyJobAppService : MosaicTalentAppServiceBase, ICompanyJobAppService
{
    private readonly IRepository<Company, Guid> _companyRepository;
    private readonly IRepository<CompanyEmployee, Guid> _companyEmployeeRepository;
    private readonly IRepository<Job, Guid> _jobRepository;
    private readonly IRepository<JobApplication, Guid> _jobApplicationRepository;
    private readonly IRepository<PublicJobApplication, Guid> _publicJobApplicationRepository;
    private readonly IRepository<CompanyJobsPageSettings, Guid> _jobsPageSettingsRepository;
    private readonly IRepository<Developer, Guid> _developerRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly IGroqChatService _groqChatService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CompanyJobAppService(
        IRepository<Company, Guid> companyRepository,
        IRepository<CompanyEmployee, Guid> companyEmployeeRepository,
        IRepository<Job, Guid> jobRepository,
        IRepository<JobApplication, Guid> jobApplicationRepository,
        IRepository<PublicJobApplication, Guid> publicJobApplicationRepository,
        IRepository<CompanyJobsPageSettings, Guid> jobsPageSettingsRepository,
        IRepository<Developer, Guid> developerRepository,
        IRepository<User, long> userRepository,
        IGroqChatService groqChatService,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        IHttpContextAccessor httpContextAccessor)
    {
        _companyRepository = companyRepository;
        _companyEmployeeRepository = companyEmployeeRepository;
        _jobRepository = jobRepository;
        _jobApplicationRepository = jobApplicationRepository;
        _publicJobApplicationRepository = publicJobApplicationRepository;
        _jobsPageSettingsRepository = jobsPageSettingsRepository;
        _developerRepository = developerRepository;
        _userRepository = userRepository;
        _groqChatService = groqChatService;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _httpContextAccessor = httpContextAccessor;
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
        }
        catch (Exception ex) when (IsMissingRelation(ex))
        {
            throw new UserFriendlyException("Public applications are not ready yet. Please run the latest database migrations.");
        }

        try
        {
            var company = await GetCompanyByTenant(tenantId);
            var settings = await TryGetPageSettingsOrNull(tenantId, company.Id);
            await SendApplicationReceivedEmailAsync(company, settings, job, publicApplication, aiAssessment);
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
            AiProjects = ToProjectDtos(aiAssessment.Projects),
            AiMosaic = aiAssessment.Mosaic,
        };
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
                AiProjects = new List<AiProjectDto>(),
                AiMosaic = new Dictionary<string, double>(),
            };
        }).ToList();
    }

    private async Task<List<JobApplicationDto>> MapPublicApplications(List<PublicJobApplication> applications)
    {
        if (applications.Count == 0)
        {
            return new List<JobApplicationDto>();
        }

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
                AiProjects = ToProjectDtos(assessment.Projects),
                AiMosaic = assessment.Mosaic,
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
                body = "Hi {candidateName},\n\nThanks for applying to {companyName} for {jobTitle}. We received your application and our team will review it soon.\n\nRegards,\n{companyName} Team",
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
        ApplicationAssessment assessment)
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
        var subject = ReplaceEmailTokens(subjectTemplate, company, job, application, assessment);

        var bodyText = string.Empty;
        if (string.Equals(emailSettings.ApplicationReceivedMode, "ai", StringComparison.OrdinalIgnoreCase) && _groqChatService.IsConfigured())
        {
            bodyText = await GenerateApplicationReceivedEmailBodyWithAi(company, job, application, assessment);
        }

        if (string.IsNullOrWhiteSpace(bodyText))
        {
            var bodyTemplate = string.IsNullOrWhiteSpace(emailSettings.ApplicationReceivedBody)
                ? "Hi {candidateName},\n\nThanks for applying to {companyName} for {jobTitle}. We received your application and our team will review it soon.\n\nRegards,\n{companyName} Team"
                : emailSettings.ApplicationReceivedBody;
            bodyText = ReplaceEmailTokens(bodyTemplate, company, job, application, assessment);
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
        ApplicationAssessment assessment)
    {
        var output = template ?? string.Empty;
        output = output.Replace("{candidateName}", application.FullName ?? "Candidate", StringComparison.OrdinalIgnoreCase);
        output = output.Replace("{jobTitle}", job.Title ?? "this role", StringComparison.OrdinalIgnoreCase);
        output = output.Replace("{companyName}", company.Name ?? "our company", StringComparison.OrdinalIgnoreCase);
        output = output.Replace("{matchScore}", assessment.Score.ToString("0.#"), StringComparison.OrdinalIgnoreCase);
        output = output.Replace("{verdict}", assessment.Verdict ?? "pending review", StringComparison.OrdinalIgnoreCase);
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

    private async Task TrySendAssessmentInviteForMemberApplication(Job job, JobApplication application)
    {
        try
        {
            var recipient = await ResolveMemberApplicationRecipientAsync(application);
            if (string.IsNullOrWhiteSpace(recipient.Email))
            {
                return;
            }

            var link = BuildAssessmentUrl(application.Id);
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

            var link = BuildAssessmentUrl(application.Id);
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

    private string BuildAssessmentUrl(Guid applicationId)
    {
        var request = _httpContextAccessor.HttpContext?.Request;
        if (request != null && request.Host.HasValue)
        {
            return $"{request.Scheme}://{request.Host}/assessment/{applicationId}";
        }

        var clientRoot = _configuration["App:ClientRootAddress"] ?? _configuration["App__ClientRootAddress"] ?? string.Empty;
        clientRoot = (clientRoot ?? string.Empty).Trim().TrimEnd('/');
        if (string.IsNullOrWhiteSpace(clientRoot))
        {
            return $"/assessment/{applicationId}";
        }

        return $"{clientRoot}/assessment/{applicationId}";
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
            return SafeTrim(ExtractPdfLikeText(bytes));
        }

        return SafeTrim(ExtractPdfLikeText(bytes));
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
        if (!_groqChatService.IsConfigured())
        {
            return fallback;
        }

        var systemPrompt =
            "You are a strict hiring assistant. Return JSON only with keys: " +
            "score (0-100), summary, verdict, strengths (array), weaknesses (array), skills (array), githubRepo, " +
            "projects (array of objects with name, description, technologies array, score), " +
            "mosaic (object with technical, problemSolving, collaboration, communication between 0 and 100).";
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
            var mosaic = root.TryGetProperty("mosaic", out var mosaicNode) ? ReadMosaicScores(mosaicNode) : fallback.Mosaic;

            return new ApplicationAssessment
            {
                Score = ClampScore(score),
                Summary = string.IsNullOrWhiteSpace(summary) ? fallback.Summary : summary.Trim(),
                Verdict = string.IsNullOrWhiteSpace(verdict) ? fallback.Verdict : verdict.Trim(),
                Strengths = strengths.Count == 0 ? fallback.Strengths : strengths.Take(5).ToList(),
                Weaknesses = weaknesses.Count == 0 ? fallback.Weaknesses : weaknesses.Take(5).ToList(),
                ExtractedSkills = skills.Take(12).ToList(),
                GithubRepo = githubRepo ?? string.Empty,
                Projects = projects.Count == 0 ? fallback.Projects : projects.Take(6).ToList(),
                Mosaic = mosaic.Count == 0 ? fallback.Mosaic : mosaic,
            };
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

        var skillBank = new[] { "c#", ".net", "javascript", "typescript", "react", "next", "sql", "postgres", "azure", "aws", "docker", "kubernetes", "testing", "qa", "python", "java" };
        var extractedSkills = skillBank.Where(skill => text.Contains(skill)).Distinct().Take(12).ToList();
        var matched = extractedSkills.Count(skill => corpus.Contains(skill));
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
            Mosaic = BuildFallbackMosaic(score),
        };
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
        root["__ai_projects"] = assessment.Projects;
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
            fallback.Projects = doc.RootElement.TryGetProperty("__ai_projects", out var projectsNode) ? ReadProjectArray(projectsNode) : new List<ProjectInsight>();
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
        public List<ProjectInsight> Projects { get; set; } = new();
        public Dictionary<string, double> Mosaic { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    }

    private sealed class ProjectInsight
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double Score { get; set; }
        public List<string> Technologies { get; set; } = new();
    }

    private sealed class EmailTemplateSettings
    {
        public bool ApplicationReceivedEnabled { get; set; } = true;
        public string ApplicationReceivedMode { get; set; } = "manual";
        public string ApplicationReceivedSubject { get; set; } = "Application received for {jobTitle}";
        public string ApplicationReceivedBody { get; set; } =
            "Hi {candidateName},\n\nThanks for applying to {companyName} for {jobTitle}. We received your application and our team will review it soon.\n\nRegards,\n{companyName} Team";
    }
}
