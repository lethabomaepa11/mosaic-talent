using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.PeerReviewService;
using Shouldly;
using System;
using Xunit;

namespace MosaicTalent.Tests.Services.PeerReviewService;

public class PeerReviewRequestPolicy_Tests
{
    private static readonly DateTime Now = new(2026, 10, 12, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Allows_request_after_two_weeks_and_cooldown()
    {
        var result = PeerReviewRequestPolicy.Evaluate(
            ProjectStatus.InProgress,
            isMember: true,
            memberCount: 3,
            memberSince: Now.AddDays(-14),
            lastRequestAt: Now.AddDays(-15),
            now: Now);

        result.CanRequest.ShouldBeTrue();
    }

    [Fact]
    public void Reports_remaining_membership_time()
    {
        var result = PeerReviewRequestPolicy.Evaluate(
            ProjectStatus.Open,
            isMember: true,
            memberCount: 2,
            memberSince: Now.AddDays(-11),
            lastRequestAt: null,
            now: Now);

        result.CanRequest.ShouldBeFalse();
        result.Message.ShouldContain("3 day(s)");
    }

    [Fact]
    public void Enforces_fourteen_day_request_cooldown()
    {
        var result = PeerReviewRequestPolicy.Evaluate(
            ProjectStatus.InProgress,
            isMember: true,
            memberCount: 2,
            memberSince: Now.AddDays(-30),
            lastRequestAt: Now.AddDays(-2),
            now: Now);

        result.CanRequest.ShouldBeFalse();
        result.Message.ShouldContain("another review in 12 day(s)");
    }

    [Theory]
    [InlineData(ProjectStatus.Draft)]
    [InlineData(ProjectStatus.Complete)]
    public void Does_not_allow_early_requests_outside_active_projects(ProjectStatus status)
    {
        var result = PeerReviewRequestPolicy.Evaluate(
            status,
            isMember: true,
            memberCount: 2,
            memberSince: Now.AddDays(-30),
            lastRequestAt: null,
            now: Now);

        result.CanRequest.ShouldBeFalse();
    }

    [Fact]
    public void Requires_a_teammate()
    {
        var result = PeerReviewRequestPolicy.Evaluate(
            ProjectStatus.Open,
            isMember: true,
            memberCount: 1,
            memberSince: Now.AddDays(-30),
            lastRequestAt: null,
            now: Now);

        result.CanRequest.ShouldBeFalse();
        result.Message.ShouldContain("teammate must join");
    }
}
