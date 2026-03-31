using MosaicTalent.Services.GamificationService.DTO;
using System;
using System.Threading.Tasks;

namespace MosaicTalent.Services.GamificationService;

public interface IDeveloperGamificationService
{
    Task<GamificationRewardDto> AwardAsync(int tenantId, Guid developerId, string eventType, string eventKey, string metadata = "");
    Task<DeveloperGamificationSummaryDto> GetSummaryAsync(int tenantId, Guid developerId);
}
