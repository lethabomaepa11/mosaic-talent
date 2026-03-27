using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.PeerReviewService.DTO;

public class SetPeerReviewRatingInput
{
    public Guid ReviewId { get; set; }

    [Range(1, 10)]
    public int Rating { get; set; }
}

