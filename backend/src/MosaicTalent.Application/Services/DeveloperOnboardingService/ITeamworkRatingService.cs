using System;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperOnboardingService;

public interface ITeamworkRatingService
{
    Task<double> RecalculateForDeveloperAsync(int? tenantId, Guid developerId);
}
