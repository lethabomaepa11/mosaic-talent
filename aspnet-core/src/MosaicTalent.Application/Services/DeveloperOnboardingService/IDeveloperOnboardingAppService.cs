using Abp.Application.Services;
using MosaicTalent.Services.DeveloperOnboardingService.DTO;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperOnboardingService;

public interface IDeveloperOnboardingAppService : IApplicationService
{
    Task<DeveloperOnboardingDto> GetMyProfile();
    Task<DeveloperOnboardingDto> UpsertMyProfile(UpsertDeveloperOnboardingInput input);
    Task<List<StudyLevelOptionDto>> GetStudyLevels();
    Task<DeveloperLearningPathResultDto> GetMyLearningPathRecommendations();
}
