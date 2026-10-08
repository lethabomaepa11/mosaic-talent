using System;
using System.Collections.Generic;

namespace MosaicTalent.Services.GamificationService.DTO;

public class DeveloperGamificationSummaryDto
{
    public int TotalPoints { get; set; }
    public int Level { get; set; } = 1;
    public int NextLevelPoints { get; set; } = 100;
    public double ProgressPercent { get; set; }
    public List<DeveloperBadgeDto> Badges { get; set; } = new();
    public List<DeveloperGamificationEventDto> RecentEvents { get; set; } = new();
}

public class DeveloperBadgeDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime EarnedAt { get; set; }
}

public class DeveloperGamificationEventDto
{
    public string EventType { get; set; } = string.Empty;
    public int PointsAwarded { get; set; }
    public DateTime OccurredAt { get; set; }
}

public class GamificationRewardDto
{
    public int PointsAwarded { get; set; }
    public int TotalPoints { get; set; }
    public int Level { get; set; }
    public List<string> BadgesUnlocked { get; set; } = new();
}
