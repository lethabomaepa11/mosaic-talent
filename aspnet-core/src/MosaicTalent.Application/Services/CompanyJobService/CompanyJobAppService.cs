using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Companies;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Services.CompanyJobService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MosaicTalent.Services.CompanyJobService;

[AbpAuthorize]
public class CompanyJobAppService : MosaicTalentAppServiceBase, ICompanyJobAppService
{
    private readonly IRepository<Company, Guid> _companyRepository;
    private readonly IRepository<CompanyEmployee, Guid> _companyEmployeeRepository;
    private readonly IRepository<Job, Guid> _jobRepository;
    private readonly IRepository<JobApplication, Guid> _jobApplicationRepository;
    private readonly IRepository<Developer, Guid> _developerRepository;
    private readonly IRepository<User, long> _userRepository;

    public CompanyJobAppService(
        IRepository<Company, Guid> companyRepository,
        IRepository<CompanyEmployee, Guid> companyEmployeeRepository,
        IRepository<Job, Guid> jobRepository,
        IRepository<JobApplication, Guid> jobApplicationRepository,
        IRepository<Developer, Guid> developerRepository,
        IRepository<User, long> userRepository)
    {
        _companyRepository = companyRepository;
        _companyEmployeeRepository = companyEmployeeRepository;
        _jobRepository = jobRepository;
        _jobApplicationRepository = jobApplicationRepository;
        _developerRepository = developerRepository;
        _userRepository = userRepository;
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

        var query = _jobApplicationRepository.GetAll()
            .Where(x => x.JobId == job.Id);

        if (!isCompanyEmployee)
        {
            if (myDeveloperId == null)
            {
                throw new UserFriendlyException("You are not authorized to view these applications.");
            }

            query = query.Where(x => x.CandidateDeveloperId == myDeveloperId.Value);
        }

        var applications = await query
            .OrderByDescending(x => x.CreationTime)
            .ToListAsync();

        return await MapApplications(applications);
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
        var applicationCounts = await _jobApplicationRepository.GetAll()
            .Where(x => jobIds.Contains(x.JobId))
            .GroupBy(x => x.JobId)
            .Select(group => new
            {
                JobId = group.Key,
                Count = group.Count(),
            })
            .ToDictionaryAsync(x => x.JobId, x => x.Count);

        return jobs.Select(job => new JobDto
        {
            Id = job.Id,
            CompanyId = job.CompanyId,
            Title = job.Title,
            Description = job.Description,
            Location = job.Location,
            EmploymentType = ToEmploymentTypeLabel(job.EmploymentType),
            IsOpen = job.IsOpen,
            ContractDuration = job.ContractDuration,
            TechnicalAssessmentPrompt = job.TechnicalAssessmentPrompt,
            BehaviouralAssessmentPrompt = job.BehaviouralAssessmentPrompt,
            CreatedAt = job.CreationTime,
            ApplicationCount = applicationCounts.TryGetValue(job.Id, out var count) ? count : 0,
        }).ToList();
    }

    private async Task<List<JobApplicationDto>> MapApplications(List<JobApplication> applications)
    {
        if (applications.Count == 0)
        {
            return new List<JobApplicationDto>();
        }

        var candidateIds = applications.Select(x => x.CandidateDeveloperId).Distinct().ToList();
        var developers = await _developerRepository.GetAll()
            .Where(x => candidateIds.Contains(x.Id))
            .ToListAsync();
        var userIds = developers.Select(x => x.UserId).Distinct().ToList();
        var users = await _userRepository.GetAll()
            .Where(x => userIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x);

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

        return await _developerRepository.GetAll()
            .FirstOrDefaultAsync(x => x.UserId == userId.Value);
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
}
