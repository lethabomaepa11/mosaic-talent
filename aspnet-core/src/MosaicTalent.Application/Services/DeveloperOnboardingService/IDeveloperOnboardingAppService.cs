using Abp.Application.Services;
using MosaicTalent.Services.DeveloperOnboardingService.DTO;
using MosaicTalent.Services.GamificationService.DTO;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperOnboardingService;

public interface IDeveloperOnboardingAppService : IApplicationService
{
    Task<DeveloperPublicProfileDto> GetPublicProfile(GetPublicDeveloperProfileInput input);
    Task<List<DeveloperSearchResultDto>> SearchPublicDevelopers(GetPublicDeveloperSearchResultsInput input);
    Task<DeveloperOnboardingDto> GetMyProfile();
    Task<DeveloperOnboardingDto> UpsertMyProfile(UpsertDeveloperOnboardingInput input);
    Task<List<StudyLevelOptionDto>> GetStudyLevels();
    Task<DeveloperLearningPathResultDto> GetMyLearningPathRecommendations();
    Task<ProfileFieldSuggestionsDto> GetProfileFieldSuggestions(GetProfileFieldSuggestionsInput input);
    Task<DeveloperGamificationSummaryDto> GetMyGamificationSummary();
}
