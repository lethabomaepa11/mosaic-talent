using Microsoft.EntityFrameworkCore;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Services.GamificationService;
using MosaicTalent.Services.GamificationService.DTO;
using Shouldly;
using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace MosaicTalent.Tests.Gamification;

public class DeveloperGamificationService_Tests : MosaicTalentTestBase
{
    private const int TenantId = 1;

    [Fact]
    public async Task AwardAsync_Should_Unlock_ReviewCollaborator_Only_On_Third_Completion()
    {
        var developerId = await EnsureCurrentDeveloperAsync();
        await ResetGamificationStateAsync(developerId);

        var first = await AwardAsync(developerId, "peer_review_completed", "review-complete-1");
        var second = await AwardAsync(developerId, "peer_review_completed", "review-complete-2");
        var third = await AwardAsync(developerId, "peer_review_completed", "review-complete-3");

        first.ShouldNotBeNull();
        second.ShouldNotBeNull();
        third.ShouldNotBeNull();

        first.BadgesUnlocked.ShouldNotContain("Review Collaborator");
        second.BadgesUnlocked.ShouldNotContain("Review Collaborator");
        third.BadgesUnlocked.ShouldContain("Review Collaborator");
    }

    [Fact]
    public async Task AwardAsync_Should_Unlock_TrustedTeammate_Only_On_Third_Received_Review()
    {
        var developerId = await EnsureCurrentDeveloperAsync();
        await ResetGamificationStateAsync(developerId);

        var first = await AwardAsync(developerId, "peer_review_received", "review-received-1");
        var second = await AwardAsync(developerId, "peer_review_received", "review-received-2");
        var third = await AwardAsync(developerId, "peer_review_received", "review-received-3");

        first.ShouldNotBeNull();
        second.ShouldNotBeNull();
        third.ShouldNotBeNull();

        first.BadgesUnlocked.ShouldNotContain("Trusted Teammate");
        second.BadgesUnlocked.ShouldNotContain("Trusted Teammate");
        third.BadgesUnlocked.ShouldContain("Trusted Teammate");
    }

    [Fact]
    public async Task AwardAsync_Should_Unlock_SimulationLearner_Only_On_Third_Evaluation()
    {
        var developerId = await EnsureCurrentDeveloperAsync();
        await ResetGamificationStateAsync(developerId);

        var first = await AwardAsync(developerId, "simulation_evaluated", "simulation-eval-1");
        var second = await AwardAsync(developerId, "simulation_evaluated", "simulation-eval-2");
        var third = await AwardAsync(developerId, "simulation_evaluated", "simulation-eval-3");

        first.ShouldNotBeNull();
        second.ShouldNotBeNull();
        third.ShouldNotBeNull();

        first.BadgesUnlocked.ShouldNotContain("Simulation Learner");
        second.BadgesUnlocked.ShouldNotContain("Simulation Learner");
        third.BadgesUnlocked.ShouldContain("Simulation Learner");
    }

    private async Task<Guid> EnsureCurrentDeveloperAsync()
    {
        var user = await GetCurrentUserAsync();

        return await UsingDbContextAsync(TenantId, async context =>
        {
            var developer = await context.Developers.FirstOrDefaultAsync(x => x.UserId == user.Id);
            if (developer != null)
            {
                return developer.Id;
            }

            developer = new Developer
            {
                UserId = user.Id,
                GithubUsername = $"gamification-test-{user.Id}",
                StudyLevel = StudyLevel.Undergrad,
            };

            await context.Developers.AddAsync(developer);
            await context.SaveChangesAsync();
            return developer.Id;
        });
    }

    private Task ResetGamificationStateAsync(Guid developerId)
    {
        return UsingDbContextAsync(TenantId, async context =>
        {
            var events = await context.DeveloperEngagementEvents
                .Where(x => x.TenantId == TenantId && x.DeveloperId == developerId)
                .ToListAsync();
            var badges = await context.DeveloperEngagementBadges
                .Where(x => x.TenantId == TenantId && x.DeveloperId == developerId)
                .ToListAsync();
            var profiles = await context.DeveloperEngagementProfiles
                .Where(x => x.TenantId == TenantId && x.DeveloperId == developerId)
                .ToListAsync();

            context.DeveloperEngagementEvents.RemoveRange(events);
            context.DeveloperEngagementBadges.RemoveRange(badges);
            context.DeveloperEngagementProfiles.RemoveRange(profiles);

            await context.DeveloperEngagementProfiles.AddAsync(new MosaicTalent.Domains.Gamification.DeveloperEngagementProfile
            {
                TenantId = TenantId,
                DeveloperId = developerId,
                TotalPoints = 0,
                Level = 1,
            });
            await context.SaveChangesAsync();
        });
    }

    private async Task<GamificationRewardDto> AwardAsync(
        Guid developerId,
        string eventType,
        string eventKey)
    {
        GamificationRewardDto reward = null;

        using (UsingTenantId(TenantId))
        {
            await WithUnitOfWorkAsync(async () =>
            {
                var service = Resolve<IDeveloperGamificationService>();
                reward = await service.AwardAsync(TenantId, developerId, eventType, eventKey);
            });
        }

        return reward;
    }
}
