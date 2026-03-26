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
    Task<DeveloperProjectDto> CreateProject(CreateDeveloperProjectInput input);
    Task<DeveloperProjectDto> JoinProject(JoinDeveloperProjectInput input);
    Task<DeveloperProjectDto> AiMatchProject();
    Task<DeveloperProjectDto> AiFillTeam(GetDeveloperProjectInput input);
    Task<DeveloperProjectTaskDto> AddProjectTask(AddProjectTaskInput input);
    Task<DeveloperProjectTaskDto> UpdateProjectTaskStatus(UpdateProjectTaskStatusInput input);
    Task<DeveloperProjectDto> CompleteProject(GetDeveloperProjectInput input);
}
