using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.DeveloperProjectService.DTO;
using MosaicTalent.Services.DeveloperOnboardingService.DTO;

namespace MosaicTalent.Services.BuildJourneyService.DTO;

public class BuildProjectDto
{
    public DeveloperProjectDto Project { get; set; }
    public BuildPurpose Purpose { get; set; }
    public string FirstOutcome { get; set; }
    public string TeamTimeZone { get; set; }
    public bool IsMember { get; set; }
    public bool CanManage { get; set; }
    public Guid CurrentDeveloperId { get; set; }
    public Guid? PendingInviteId { get; set; }
    public List<BuildTaskDetailsDto> TaskDetails { get; set; } = new();
}

public class BuildTaskDetailsDto
{
    public Guid Id { get; set; }
    public bool IsStarterTask { get; set; }
    public string AcceptanceCriteria { get; set; }
}

public class BuildHomeDto
{
    public DeveloperOnboardingDto Profile { get; set; }
    public Guid DeveloperId { get; set; }
    public List<BuildProjectDto> MyProjects { get; set; } = new();
    public List<BuildProjectDto> OpenProjects { get; set; } = new();
}

public class CreateBuildInput : CreateDeveloperProjectInput
{
    public bool CreateStarterTask { get; set; }
    [EnumDataType(typeof(BuildPurpose))]
    public BuildPurpose Purpose { get; set; }
    [MaxLength(800)] public string FirstOutcome { get; set; }
    [MaxLength(64)] public string TeamTimeZone { get; set; }
}

public class CreateBuildTaskInput : AddProjectTaskInput
{
    public bool IsStarterTask { get; set; }
    [MaxLength(2000)] public string AcceptanceCriteria { get; set; }
}

public class ClaimBuildTaskInput
{
    [Required] public Guid ProjectId { get; set; }
    [Required] public Guid TaskId { get; set; }
}

public class MyContributionDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectTitle { get; set; }
    public string Title { get; set; }
    public string Summary { get; set; }
    public string EvidenceUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ReviewCount { get; set; }
}
