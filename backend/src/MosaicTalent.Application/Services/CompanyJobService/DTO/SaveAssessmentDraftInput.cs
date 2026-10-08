using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.CompanyJobService.DTO
{
    public class SaveAssessmentDraftInput
    {
        public Guid AssessmentId { get; set; }

        [Required]
        [MaxLength(40000)]
        public string SubmissionText { get; set; }

        [MaxLength(2048)]
        public string GithubRepoUrl { get; set; }
    }
}
