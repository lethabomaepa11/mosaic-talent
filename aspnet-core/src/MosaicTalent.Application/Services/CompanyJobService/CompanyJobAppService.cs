using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Companies;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Services.AiService;
using MosaicTalent.Services.CompanyJobService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

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

    public CompanyJobAppService(
        IRepository<Company, Guid> companyRepository,
        IRepository<CompanyEmployee, Guid> companyEmployeeRepository,
        IRepository<Job, Guid> jobRepository,
        IRepository<JobApplication, Guid> jobApplicationRepository,
        IRepository<PublicJobApplication, Guid> publicJobApplicationRepository,
        IRepository<CompanyJobsPageSettings, Guid> jobsPageSettingsRepository,
        IRepository<Developer, Guid> developerRepository,
        IRepository<User, long> userRepository,
        IGroqChatService groqChatService)
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
        var job = await _jobRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == input.JobId && x.TenantId == tenantId)
            ?? throw new UserFriendlyException("Job not found.");

        if (!job.IsOpen)
        {
            throw new UserFriendlyException("This job is no longer accepting applications.");
        }

        var developer = await GetCurrentDeveloperOrNull();
        var source = ParseApplicationSource(input.Source);
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
            ApplicationResponseJson = input.ResponsesJson?.Trim(),
            Source = source,
            MatchScore = 0,
            MatchReason = "Pending AI evaluation.",
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
        var application = await _jobApplicationRepository.FirstOrDefaultAsync(input.JobApplicationId)
            ?? throw new UserFriendlyException("Job application not found.");
        var job = await _jobRepository.FirstOrDefaultAsync(application.JobId)
            ?? throw new UserFriendlyException("Job not found.");
        await EnsureJobAdmin(job);

        application.Status = ParseApplicationStatus(input.Status);
        await _jobApplicationRepository.UpdateAsync(application);
        await CurrentUnitOfWork.SaveChangesAsync();

        var mapped = await MapApplications(new List<JobApplication> { application });
        return mapped.First();
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
        };
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
            message.Contains("relation \"CompanyJobsPageSettings\" does not exist", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("relation \"PublicJobApplications\" does not exist", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return exception.InnerException != null && IsMissingRelation(exception.InnerException);
    }
}
