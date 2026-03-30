using System;
using System.Threading.Tasks;

namespace MosaicTalent.Services.PeerReviewService;

public interface IPeerReviewGenerationService
{
    Task EnsureGeneratedForProject(Guid projectId, int tenantId);
}

