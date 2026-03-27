using System;
using System.Collections.Generic;

namespace MosaicTalent.Services.CompanyJobService.DTO;

public class JobApplicationDto
{
    public Guid Id { get; set; }

    public Guid JobId { get; set; }

    public Guid CandidateDeveloperId { get; set; }

    public string CandidateName { get; set; }

    public string CandidateEmail { get; set; }

    public string ResumeStoredFileId { get; set; }

    public double MatchScore { get; set; }

    public string MatchReason { get; set; }

    public string Source { get; set; }

    public string Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public bool IsPublicApplication { get; set; }

    public string ApplicationResponseJson { get; set; }

    public List<string> AiStrengths { get; set; } = new();

    public List<string> AiWeaknesses { get; set; } = new();

    public string AiVerdict { get; set; } = string.Empty;

    public List<string> AiExtractedSkills { get; set; } = new();

    public string AiGithubRepo { get; set; } = string.Empty;

    public List<AiProjectDto> AiProjects { get; set; } = new();

    public Dictionary<string, double> AiMosaic { get; set; } = new();

    public Guid? AssessmentId { get; set; }

    public string AssessmentStatus { get; set; } = string.Empty;

    public double? AssessmentScore { get; set; }

    public string AssessmentVerdict { get; set; } = string.Empty;

    public DateTime? AssessmentSubmittedAt { get; set; }
}

public class AiProjectDto
{
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public double Score { get; set; }

    public List<string> Technologies { get; set; } = new();
}
