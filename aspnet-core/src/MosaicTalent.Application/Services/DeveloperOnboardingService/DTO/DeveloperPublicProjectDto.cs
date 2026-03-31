using System;
using System.Collections.Generic;

namespace MosaicTalent.Services.DeveloperOnboardingService.DTO;

public class DeveloperPublicProjectDto
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string Status { get; set; }
    public string GithubRepo { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> Skills { get; set; } = new();
}
