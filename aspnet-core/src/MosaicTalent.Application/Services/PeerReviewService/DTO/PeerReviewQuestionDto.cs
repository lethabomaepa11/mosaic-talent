using System;

namespace MosaicTalent.Services.PeerReviewService.DTO;

public class PeerReviewQuestionDto
{
    public Guid Id { get; set; }

    public string Text { get; set; }

    public string Type { get; set; }

    public string RelatedGoal { get; set; }

    public string Category { get; set; }

    public string AnswerText { get; set; }
}

