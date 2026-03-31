using Abp.Dependency;
using Abp.Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Domains.Gamification;
using MosaicTalent.Services.GamificationService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MosaicTalent.Services.GamificationService;

public class DeveloperGamificationService : IDeveloperGamificationService, ITransientDependency
{
    private readonly IRepository<DeveloperEngagementProfile, Guid> _profileRepository;
    private readonly IRepository<DeveloperEngagementBadge, Guid> _badgeRepository;
    private readonly IRepository<DeveloperEngagementEvent, Guid> _eventRepository;

    public DeveloperGamificationService(
        IRepository<DeveloperEngagementProfile, Guid> profileRepository,
        IRepository<DeveloperEngagementBadge, Guid> badgeRepository,
        IRepository<DeveloperEngagementEvent, Guid> eventRepository)
    {
        _profileRepository = profileRepository;
        _badgeRepository = badgeRepository;
        _eventRepository = eventRepository;
    }

    public async Task<GamificationRewardDto> AwardAsync(int tenantId, Guid developerId, string eventType, string eventKey, string metadata = "")
    {
        if (tenantId <= 0 || developerId == Guid.Empty || string.IsNullOrWhiteSpace(eventType) || string.IsNullOrWhiteSpace(eventKey))
        {
            return null;
        }

        var normalizedType = eventType.Trim().ToLowerInvariant();
        var normalizedKey = eventKey.Trim().ToLowerInvariant();
        var alreadyAwarded = await _eventRepository.GetAll()
            .AnyAsync(x => x.TenantId == tenantId && x.DeveloperId == developerId && x.EventKey == normalizedKey);
        if (alreadyAwarded)
        {
            return null;
        }

        var points = ResolvePoints(normalizedType);
        if (points <= 0)
        {
            return null;
        }

        var profile = await _profileRepository.GetAll()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.DeveloperId == developerId);
        if (profile == null)
        {
            profile = new DeveloperEngagementProfile
            {
                TenantId = tenantId,
                DeveloperId = developerId,
                TotalPoints = 0,
                Level = 1,
            };
            await _profileRepository.InsertAsync(profile);
        }

        profile.TotalPoints += points;
        profile.Level = ResolveLevel(profile.TotalPoints);
        profile.LastRewardedAt = DateTime.UtcNow;
        await _profileRepository.UpdateAsync(profile);

        await _eventRepository.InsertAsync(new DeveloperEngagementEvent
        {
            TenantId = tenantId,
            DeveloperId = developerId,
            EventType = normalizedType,
            EventKey = normalizedKey,
            PointsAwarded = points,
            MetadataJson = string.IsNullOrWhiteSpace(metadata) ? null : metadata.Trim(),
            OccurredAt = DateTime.UtcNow,
        });

        var unlocked = await UnlockBadgesAsync(tenantId, developerId, normalizedType, profile);

        return new GamificationRewardDto
        {
            PointsAwarded = points,
            TotalPoints = profile.TotalPoints,
            Level = profile.Level,
            BadgesUnlocked = unlocked,
        };
    }

    public async Task<DeveloperGamificationSummaryDto> GetSummaryAsync(int tenantId, Guid developerId)
    {
        if (tenantId <= 0 || developerId == Guid.Empty)
        {
            return new DeveloperGamificationSummaryDto();
        }

        var profile = await _profileRepository.GetAll()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.DeveloperId == developerId);
        var totalPoints = profile?.TotalPoints ?? 0;
        var level = ResolveLevel(totalPoints);
        var levelFloor = (level - 1) * 100;
        var nextLevelPoints = level * 100;
        var denominator = Math.Max(nextLevelPoints - levelFloor, 1);
        var progress = Math.Clamp(((double)(totalPoints - levelFloor) / denominator) * 100, 0, 100);

        var badges = await _badgeRepository.GetAll()
            .Where(x => x.TenantId == tenantId && x.DeveloperId == developerId)
            .OrderByDescending(x => x.EarnedAt)
            .Take(24)
            .ToListAsync();

        var recentEvents = await _eventRepository.GetAll()
            .Where(x => x.TenantId == tenantId && x.DeveloperId == developerId)
            .OrderByDescending(x => x.OccurredAt)
            .Take(12)
            .ToListAsync();

        return new DeveloperGamificationSummaryDto
        {
            TotalPoints = totalPoints,
            Level = level,
            NextLevelPoints = nextLevelPoints,
            ProgressPercent = progress,
            Badges = badges.Select(x => new DeveloperBadgeDto
            {
                Code = x.BadgeCode,
                Name = x.Name,
                Description = x.Description ?? string.Empty,
                EarnedAt = x.EarnedAt,
            }).ToList(),
            RecentEvents = recentEvents.Select(x => new DeveloperGamificationEventDto
            {
                EventType = x.EventType,
                PointsAwarded = x.PointsAwarded,
                OccurredAt = x.OccurredAt,
            }).ToList(),
        };
    }

    private async Task<List<string>> UnlockBadgesAsync(int tenantId, Guid developerId, string latestEventType, DeveloperEngagementProfile profile)
    {
        var unlocked = new List<string>();
        var existingBadgeCodes = (await _badgeRepository.GetAll()
            .Where(x => x.TenantId == tenantId && x.DeveloperId == developerId)
            .Select(x => x.BadgeCode)
            .ToListAsync())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        async Task TryUnlock(string code, string name, string description, bool condition)
        {
            if (!condition || existingBadgeCodes.Contains(code))
            {
                return;
            }

            await _badgeRepository.InsertAsync(new DeveloperEngagementBadge
            {
                TenantId = tenantId,
                DeveloperId = developerId,
                BadgeCode = code,
                Name = name,
                Description = description,
                EarnedAt = DateTime.UtcNow,
            });
            existingBadgeCodes.Add(code);
            unlocked.Add(name);
        }

        var reviewCompletedCount = await CountEvents(tenantId, developerId, "peer_review_completed") +
            (latestEventType == "peer_review_completed" ? 1 : 0);
        var reviewReceivedCount = await CountEvents(tenantId, developerId, "peer_review_received") +
            (latestEventType == "peer_review_received" ? 1 : 0);
        var projectCompletedCount = await CountProjectCompletionEvents(tenantId, developerId, latestEventType);
        var simulationCount = await CountEvents(tenantId, developerId, "simulation_evaluated") +
            (latestEventType == "simulation_evaluated" ? 1 : 0);

        await TryUnlock(
            "first_contribution",
            "First Contribution",
            "Awarded for earning your first community points.",
            profile.TotalPoints > 0);
        await TryUnlock(
            "review_collaborator",
            "Review Collaborator",
            "Awarded for completing at least 3 peer reviews.",
            reviewCompletedCount >= 3);
        await TryUnlock(
            "trusted_teammate",
            "Trusted Teammate",
            "Awarded when teammates complete at least 3 reviews for you.",
            reviewReceivedCount >= 3);
        await TryUnlock(
            "project_finisher",
            "Project Finisher",
            "Awarded after completing at least one project.",
            projectCompletedCount >= 1);
        await TryUnlock(
            "simulation_learner",
            "Simulation Learner",
            "Awarded after 3 completed simulation evaluations.",
            simulationCount >= 3);
        await TryUnlock(
            "level_five",
            "Level Five",
            "Awarded for reaching level 5.",
            profile.Level >= 5);

        return unlocked;
    }

    private async Task<int> CountEvents(int tenantId, Guid developerId, string eventType)
    {
        return await _eventRepository.GetAll()
            .CountAsync(x => x.TenantId == tenantId && x.DeveloperId == developerId && x.EventType == eventType);
    }

    private async Task<int> CountProjectCompletionEvents(int tenantId, Guid developerId, string latestEventType)
    {
        var historical = await _eventRepository.GetAll()
            .CountAsync(x =>
                x.TenantId == tenantId &&
                x.DeveloperId == developerId &&
                (x.EventType == "project_completed_lead" || x.EventType == "project_completed_member"));
        var latestBonus = latestEventType == "project_completed_lead" || latestEventType == "project_completed_member"
            ? 1
            : 0;

        return historical + latestBonus;
    }

    private static int ResolvePoints(string eventType)
    {
        return eventType switch
        {
            "peer_review_rating" => 10,
            "peer_review_completed" => 30,
            "peer_review_received" => 20,
            "project_completed_lead" => 60,
            "project_completed_member" => 35,
            "simulation_evaluated" => 15,
            _ => 0,
        };
    }

    private static int ResolveLevel(int totalPoints)
    {
        return Math.Max(1, (totalPoints / 100) + 1);
    }
}
