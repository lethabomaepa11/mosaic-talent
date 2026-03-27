using Abp.Application.Services;
using MosaicTalent.Services.CompanyJobService.DTO;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MosaicTalent.Services.CompanyJobService;

public interface ICompanyJobAppService : IApplicationService
{
    Task<PublicJobsPageDto> GetPublicJobsPage();
    Task<List<JobDto>> GetOpenJobs();
    Task<List<JobDto>> GetMyJobs();
    Task<JobDto> GetJob(GetJobInput input);
    Task<JobDto> CreateJob(CreateJobInput input);
    Task<JobDto> UpdateJob(UpdateJobInput input);
    Task<JobDto> ToggleJobOpenStatus(ToggleJobOpenStatusInput input);
    Task<List<JobApplicationDto>> GetJobApplications(GetJobInput input);
    Task<List<JobCandidateDto>> GetCandidatesDirectory();
    Task<PublicJobsPageDto> GetMyJobsPageSettings();
    Task<PublicJobsPageDto> UpdateMyJobsPageSettings(UpdateMyJobsPageSettingsInput input);
    Task<PublicJobsPageDto> GenerateMyJobsPageSettingsWithAi(GenerateJobsPageWithAiInput input);
    Task<JobApplicationDto> ApplyToPublicJob(ApplyToPublicJobInput input);
    Task<JobApplicationDto> ApplyToJob(ApplyToJobInput input);
    Task<JobApplicationDto> UpdateJobApplicationStatus(UpdateJobApplicationStatusInput input);
    Task SendApplicationEmail(SendApplicationEmailInput input);
}
