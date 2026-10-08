using Abp.Application.Services;
using MosaicTalent.Services.PeerReviewService.DTO;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MosaicTalent.Services.PeerReviewService;

public interface IPeerReviewAppService : IApplicationService
{
    Task<List<ProjectPeerReviewsDto>> GetMyProjectPeerReviews();
    Task<ProjectPeerReviewsDto> GetProjectPeerReviews(GetProjectPeerReviewsInput input);
    Task<ProjectPeerReviewsDto> GenerateProjectPeerReviews(GenerateProjectPeerReviewsInput input);
    Task<PeerReviewDto> SetPeerReviewRating(SetPeerReviewRatingInput input);
    Task<PeerReviewQuestionDto> SubmitReviewAnswer(SubmitReviewAnswerInput input);
}
