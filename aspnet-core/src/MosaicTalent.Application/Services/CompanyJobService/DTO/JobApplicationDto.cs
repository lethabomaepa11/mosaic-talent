using System;

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
}
