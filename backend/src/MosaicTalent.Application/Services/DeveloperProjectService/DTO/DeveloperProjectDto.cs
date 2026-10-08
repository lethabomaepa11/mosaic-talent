using System;
using System.Collections.Generic;

namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class DeveloperProjectDto
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public int? MaxMembers { get; set; }
    public string Difficulty { get; set; }
    public int EstimatedHoursPerWeek { get; set; }
    public int WorkloadScore { get; set; }
    public string GithubRepo { get; set; }
    public List<string> Skills { get; set; } = new();
    public string Type { get; set; }
    public string Status { get; set; }
    public string OwnerId { get; set; }
    public DateTime CreatedAt { get; set; }
    public int MatchScore { get; set; }
    public string MatchInsight { get; set; }
    public List<string> LearningOutcomes { get; set; } = new();
    public List<DeveloperProjectMemberDto> Members { get; set; } = new();
    public List<DeveloperProjectTaskDto> Tasks { get; set; } = new();
}
