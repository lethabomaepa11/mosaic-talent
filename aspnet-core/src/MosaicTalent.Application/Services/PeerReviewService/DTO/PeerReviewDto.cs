using System;
using System.Collections.Generic;

namespace MosaicTalent.Services.PeerReviewService.DTO;

public class PeerReviewDto
{
    public Guid Id { get; set; }

    public Guid ProjectId { get; set; }

    public string ProjectTitle { get; set; }

    public Guid ReviewerDeveloperId { get; set; }

    public string ReviewerName { get; set; }

    public Guid RevieweeDeveloperId { get; set; }

    public string RevieweeName { get; set; }

    public int Rating { get; set; }

    public bool IsCompleted { get; set; }

    public List<PeerReviewQuestionDto> Questions { get; set; } = new List<PeerReviewQuestionDto>();
}

