using System;
using System.Collections.Generic;

namespace MosaicTalent.Services.PeerReviewService.DTO;

public class ProjectPeerReviewsDto
{
    public Guid ProjectId { get; set; }

    public string ProjectTitle { get; set; }

    public List<PeerReviewDto> AssignedToMe { get; set; } = new List<PeerReviewDto>();

    public List<PeerReviewDto> ReceivedByMe { get; set; } = new List<PeerReviewDto>();

    public AIReviewFeedbackDto Feedback { get; set; }
}

