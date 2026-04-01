using System;
using System.Collections.Generic;

namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class ScanRepoSafetyInput
{
    public Guid ProjectId { get; set; }
}

public class ScanRepoSafetyByUrlInput
{
    public string GithubUrl { get; set; }
}

public class RepoSafetyScanResultDto
{
    public List<RepoSafetyProgressDto> Progress { get; set; } = new();
    public RepoSafetyResultDto Result { get; set; }
}

public class RepoSafetyProgressDto
{
    public string Step { get; set; }
    public int Progress { get; set; }
}

public class RepoSafetyResultDto
{
    public string RepoUrl { get; set; }
    public RepoSafetyMetaDto Meta { get; set; }
    public int RiskScore { get; set; }
    public string RiskLevel { get; set; }
    public List<RepoSafetyCategoryDto> Categories { get; set; } = new();
    public List<RepoSafetyFindingDto> Findings { get; set; } = new();
    public List<RepoSafetyBadgeDto> Badges { get; set; } = new();
    public DateTime? ScannedAt { get; set; }
    public string CommitSha { get; set; }
    public int? FilesScanned { get; set; }
    public int? TotalRepoFiles { get; set; }
    public bool Cached { get; set; }
}

public class RepoSafetyMetaDto
{
    public string Owner { get; set; }
    public string Repo { get; set; }
    public string Description { get; set; }
    public int? Stars { get; set; }
    public int? Forks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? PushedAt { get; set; }
    public string DefaultBranch { get; set; }
    public string Language { get; set; }
    public List<string> Topics { get; set; } = new();
    public int? OpenIssues { get; set; }
    public int? Size { get; set; }
}

public class RepoSafetyCategoryDto
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Icon { get; set; }
    public int? Score { get; set; }
    public int? MaxScore { get; set; }
    public List<RepoSafetyFindingDto> Findings { get; set; } = new();
}

public class RepoSafetyFindingDto
{
    public string RuleId { get; set; }
    public string Category { get; set; }
    public string Severity { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string FilePath { get; set; }
    public int? Points { get; set; }
}

public class RepoSafetyBadgeDto
{
    public string Type { get; set; }
    public string Label { get; set; }
    public string Description { get; set; }
}
