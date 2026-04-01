using Abp.Application.Services;
using MosaicTalent.Services.DeveloperProjectService.DTO;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperProjectService;

public interface IDeveloperProjectAppService : IApplicationService
{
    Task<List<DeveloperProjectDto>> GetMyProjects();
    Task<List<DeveloperProjectDto>> GetOpenProjects();
    Task<DeveloperProjectDto> GetProject(GetDeveloperProjectInput input);
    Task<GithubConnectionStatusDto> GetGithubConnectionStatus();
    Task<List<GithubRepositoryDto>> GetMyGithubRepositories();
    Task<GithubRepositoryDto> CreateGithubRepository(CreateGithubRepositoryInput input);
    Task<RepositoryReadmeDto> GetRepositoryReadme(RepositoryReadmeInput input);
    Task<DeveloperProjectDto> CreateProject(CreateDeveloperProjectInput input);
    Task<AiGeneratedProjectSpecDto> AiGenerateProjectSpec(AiGenerateProjectSpecInput input);
    Task<ProjectJoinLoadWarningDto> GetJoinProjectLoadWarning(GetDeveloperProjectInput input);
    Task<DeveloperProjectDto> JoinProject(JoinDeveloperProjectInput input);
    Task<DeveloperProjectDto> LeaveProject(LeaveProjectInput input);
    Task<DeveloperProjectDto> AssignMemberRole(AssignProjectMemberRoleInput input);
    Task<RepoSafetyScanResultDto> ScanRepoSafety(ScanRepoSafetyInput input);
    Task<RepoSafetyScanResultDto> ScanRepoSafetyByUrl(ScanRepoSafetyByUrlInput input);
    Task<DeveloperProjectDto> AiMatchProject();
    Task<DeveloperProjectDto> AiFillTeam(GetDeveloperProjectInput input);
    Task<List<DeveloperProjectTaskDto>> AiGenerateProjectTasks(AiGenerateProjectTasksInput input);
    Task<DeveloperProjectTaskDto> AddProjectTask(AddProjectTaskInput input);
    Task<DeveloperProjectTaskDto> UpdateProjectTaskStatus(UpdateProjectTaskStatusInput input);
    Task<DeveloperProjectDto> UpdateProjectSkills(UpdateProjectSkillsInput input);
    Task<DeveloperProjectDto> CompleteProject(GetDeveloperProjectInput input);
    Task<List<ProjectMeetingDto>> GetProjectMeetings(GetDeveloperProjectInput input);
    Task<ProjectMeetingDto> RequestProjectMeeting(RequestProjectMeetingInput input);
    Task<ProjectMeetingDto> ScheduleProjectMeeting(ScheduleProjectMeetingInput input);
    Task<ProjectMeetingDto> SetProjectMeetingReminder(SetProjectMeetingReminderInput input);
    Task<ProjectMeetingDto> CancelProjectMeeting(CancelProjectMeetingInput input);
}
