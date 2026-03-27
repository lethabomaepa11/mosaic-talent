using System;
using System.Collections.Generic;

namespace MosaicTalent.Services.CompanyJobService.DTO
{
public class JobAssessmentDto
{
        public Guid Id { get; set; }

        public Guid JobId { get; set; }

        public Guid? JobApplicationId { get; set; }

        public Guid? PublicJobApplicationId { get; set; }

        public string CandidateName { get; set; }

        public string CandidateEmail { get; set; }

        public string JobTitle { get; set; }

        public string CompanyName { get; set; }

        public string Prompt { get; set; }

        public string Instructions { get; set; }

        public string Status { get; set; }

        public string SubmissionText { get; set; }

        public string SubmissionGithubRepo { get; set; }

        public double Score { get; set; }

        public string Verdict { get; set; }

        public List<string> Strengths { get; set; } = new List<string>();

        public List<string> Weaknesses { get; set; } = new List<string>();

        public List<string> Tips { get; set; } = new List<string>();

    public DateTime? SubmittedAt { get; set; }

    public List<JobAssessmentProblemDto> Problems { get; set; } = new List<JobAssessmentProblemDto>();
}

public class JobAssessmentProblemDto
{
    public string Id { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Language { get; set; } = "javascript";

    public string StarterCode { get; set; } = string.Empty;

    public double MaxScore { get; set; } = 100;

    public int Order { get; set; }

    public List<JobAssessmentTestCaseDto> PublicTests { get; set; } = new List<JobAssessmentTestCaseDto>();
}

public class JobAssessmentTestCaseDto
{
    public string Input { get; set; } = string.Empty;

    public string ExpectedOutput { get; set; } = string.Empty;

    public string Hint { get; set; } = string.Empty;
}
}
