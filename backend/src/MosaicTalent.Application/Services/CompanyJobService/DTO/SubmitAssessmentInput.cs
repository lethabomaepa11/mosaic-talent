using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.CompanyJobService.DTO
{
    public class SubmitAssessmentInput
    {
        public Guid AssessmentId { get; set; }

        [Required]
        [MaxLength(20000)]
        public string SubmissionText { get; set; }

        [MaxLength(2048)]
        public string GithubRepoUrl { get; set; }
    }
}
