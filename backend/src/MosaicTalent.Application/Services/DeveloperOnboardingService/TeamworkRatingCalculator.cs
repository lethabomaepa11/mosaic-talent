using System;

namespace MosaicTalent.Services.DeveloperOnboardingService;

public static class TeamworkRatingCalculator
{
    public static double Calculate(double? peerReviewAverage, double? simulationAverage)
    {
        var hasPeer = peerReviewAverage.HasValue;
        var hasSimulation = simulationAverage.HasValue;

        if (!hasPeer && !hasSimulation)
        {
            return 0;
        }

        var peer = Clamp(peerReviewAverage ?? 0, 0, 10);
        var simulation = Clamp(simulationAverage ?? 0, 0, 10);

        if (hasPeer && hasSimulation)
        {
            // Peer reviews reflect real collaboration with teammates.
            var weighted = (peer * 0.6) + (simulation * 0.4);
            return Math.Round(Clamp(weighted, 0, 10), 1, MidpointRounding.AwayFromZero);
        }

        var single = hasPeer ? peer : simulation;
        return Math.Round(Clamp(single, 0, 10), 1, MidpointRounding.AwayFromZero);
    }

    private static double Clamp(double value, double min, double max)
    {
        return Math.Min(max, Math.Max(min, value));
    }
}
