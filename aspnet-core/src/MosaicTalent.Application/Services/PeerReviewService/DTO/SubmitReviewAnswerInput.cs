using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.PeerReviewService.DTO;

public class SubmitReviewAnswerInput
{
    public Guid QuestionId { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Text { get; set; }
}

