using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Reviews;
using MosaicTalent.Domains.Simulations;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperOnboardingService;

public class TeamworkRatingService : ITeamworkRatingService, ITransientDependency
{
    private readonly IRepository<Developer, Guid> _developerRepository;
    private readonly IRepository<DeveloperProfile, Guid> _profileRepository;
    private readonly IRepository<PeerReview, Guid> _peerReviewRepository;
    private readonly IRepository<AssessorObservation, Guid> _observationRepository;
    private readonly IRepository<AssessorDimensionScore, Guid> _dimensionScoreRepository;
    private readonly IUnitOfWorkManager _unitOfWorkManager;

    public TeamworkRatingService(
        IRepository<Developer, Guid> developerRepository,
        IRepository<DeveloperProfile, Guid> profileRepository,
        IRepository<PeerReview, Guid> peerReviewRepository,
        IRepository<AssessorObservation, Guid> observationRepository,
        IRepository<AssessorDimensionScore, Guid> dimensionScoreRepository,
        IUnitOfWorkManager unitOfWorkManager)
    {
        _developerRepository = developerRepository;
        _profileRepository = profileRepository;
        _peerReviewRepository = peerReviewRepository;
        _observationRepository = observationRepository;
        _dimensionScoreRepository = dimensionScoreRepository;
        _unitOfWorkManager = unitOfWorkManager;
    }

    public async Task<double> RecalculateForDeveloperAsync(int? tenantId, Guid developerId)
    {
        var developer = await _developerRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == developerId);
        if (developer == null)
        {
            return 0;
        }

        var profile = await _profileRepository.GetAll()
            .FirstOrDefaultAsync(x => x.DeveloperId == developerId);
        if (profile == null)
        {
            return 0;
        }

        var ratedPeerReviews = await _peerReviewRepository.GetAll()
            .Where(x =>
                x.RevieweeDeveloperId == developerId &&
                (!tenantId.HasValue || x.TenantId == tenantId.Value) &&
                x.LastModificationTime.HasValue)
            .Select(x => (double)x.Rating)
            .ToListAsync();
        double? peerAverage = ratedPeerReviews.Count > 0
            ? ratedPeerReviews.Average()
            : null;

        var observationIds = await _observationRepository.GetAll()
            .Where(x =>
                x.CreatorUserId == developer.UserId &&
                (!tenantId.HasValue || x.TenantId == tenantId.Value))
            .Select(x => x.Id)
            .ToListAsync();

        double? simulationAverage = null;
        if (observationIds.Count > 0)
        {
            var simulationScores = await _dimensionScoreRepository.GetAll()
                .Where(x =>
                    observationIds.Contains(x.ObservationId) &&
                    (!tenantId.HasValue || x.TenantId == tenantId.Value))
                .Select(x => x.Score)
                .ToListAsync();

            if (simulationScores.Count > 0)
            {
                simulationAverage = simulationScores.Average() / 10d;
            }
        }

        var computed = TeamworkRatingCalculator.Calculate(peerAverage, simulationAverage);
        if (Math.Abs(profile.TeamworkRating - computed) > 0.01d)
        {
            profile.TeamworkRating = computed;
            await _profileRepository.UpdateAsync(profile);
            await _unitOfWorkManager.Current.SaveChangesAsync();
        }

        return computed;
    }
}
