using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.CompanyJobService.DTO
{
    public class RunAssessmentPromptInput
    {
        public Guid AssessmentId { get; set; }

        [Required]
        [MaxLength(200)]
        public string ProblemId { get; set; }

        [Required]
        [MaxLength(4000)]
        public string Prompt { get; set; }
    }
}
