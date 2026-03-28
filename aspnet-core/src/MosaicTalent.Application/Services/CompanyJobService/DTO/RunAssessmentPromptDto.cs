using System.Collections.Generic;

namespace MosaicTalent.Services.CompanyJobService.DTO
{
    public class AssessmentProposalDto
    {
        public string Title { get; set; } = string.Empty;

        public string Patch { get; set; } = string.Empty;

        public bool IsHallucinationRisk { get; set; }
    }

    public class RunAssessmentPromptDto
    {
        public string ProblemId { get; set; } = string.Empty;

        public string Prompt { get; set; } = string.Empty;

        public string Response { get; set; } = string.Empty;

        public int PromptTokens { get; set; }

        public int CompletionTokens { get; set; }

        public int TotalTokens { get; set; }

        public List<AssessmentProposalDto> Proposals { get; set; } = new List<AssessmentProposalDto>();
    }
}
