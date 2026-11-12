using System.Collections.Generic;
using System.Threading.Tasks;
using Abp.Application.Services;
using MosaicTalent.Services.BuildJourneyService.DTO;
using MosaicTalent.Services.DeveloperProjectService.DTO;

namespace MosaicTalent.Services.BuildJourneyService;

public interface IBuildJourneyAppService : IApplicationService
{
    Task<BuildHomeDto> GetHome();
    Task<BuildProjectDto> GetBuild(GetDeveloperProjectInput input);
    Task<BuildProjectDto> CreateBuild(CreateBuildInput input);
    Task<BuildProjectDto> CreateTask(CreateBuildTaskInput input);
    Task<BuildProjectDto> ClaimTask(ClaimBuildTaskInput input);
    Task<BuildProjectDto> SetTaskStatus(UpdateProjectTaskStatusInput input);
    Task<List<MyContributionDto>> GetMyContributions();
    Task<List<BuildInvitationDto>> GetMyInvitations();
    Task InviteMember(InviteBuildMemberInput input);
}
