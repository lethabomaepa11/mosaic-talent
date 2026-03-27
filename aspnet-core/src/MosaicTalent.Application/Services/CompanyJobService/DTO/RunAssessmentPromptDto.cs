namespace MosaicTalent.Services.CompanyJobService.DTO
{
    public class RunAssessmentPromptDto
    {
        public string ProblemId { get; set; } = string.Empty;

        public string Prompt { get; set; } = string.Empty;

        public string Response { get; set; } = string.Empty;

        public int PromptTokens { get; set; }

        public int CompletionTokens { get; set; }

        public int TotalTokens { get; set; }
    }
}
