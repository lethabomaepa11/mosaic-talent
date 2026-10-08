using MosaicTalent.Services.DeveloperOnboardingService;
using Shouldly;
using Xunit;

namespace MosaicTalent.Tests.DeveloperOnboarding;

public class TeamworkRatingCalculator_Tests
{
    [Fact]
    public void Should_Return_Zero_When_No_Signals_Are_Available()
    {
        var result = TeamworkRatingCalculator.Calculate(null, null);
        result.ShouldBe(0);
    }

    [Fact]
    public void Should_Use_Weighted_Peer_And_Simulation_Scores()
    {
        var result = TeamworkRatingCalculator.Calculate(8, 6);
        result.ShouldBe(7.2);
    }

    [Fact]
    public void Should_Use_Single_Source_When_Only_One_Is_Available()
    {
        TeamworkRatingCalculator.Calculate(7.25, null).ShouldBe(7.3);
        TeamworkRatingCalculator.Calculate(null, 6.66).ShouldBe(6.7);
    }
}
