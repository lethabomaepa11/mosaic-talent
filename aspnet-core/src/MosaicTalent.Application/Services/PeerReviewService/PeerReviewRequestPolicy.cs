using MosaicTalent.Domains.Projects;
using System;

namespace MosaicTalent.Services.PeerReviewService;

public sealed class PeerReviewRequestEligibility
{
    public bool CanRequest { get; init; }
    public string Message { get; init; }
}

public static class PeerReviewRequestPolicy
{
    public static readonly TimeSpan RequestInterval = TimeSpan.FromDays(14);

    public static PeerReviewRequestEligibility Evaluate(
        ProjectStatus projectStatus,
        bool isMember,
        int memberCount,
        DateTime? memberSince,
        DateTime? lastRequestAt,
        DateTime now)
    {
        if (projectStatus != ProjectStatus.Open && projectStatus != ProjectStatus.InProgress)
        {
            return new PeerReviewRequestEligibility { Message = "Peer review requests are available when the project is open or in progress." };
        }

        if (!isMember || !memberSince.HasValue)
        {
            return new PeerReviewRequestEligibility { Message = "You must be a project member to request a peer review." };
        }

        if (memberCount < 2)
        {
            return new PeerReviewRequestEligibility { Message = "A teammate must join before you can request a review." };
        }

        var eligibleAt = memberSince.Value + RequestInterval;
        if (eligibleAt > now)
        {
            var days = Math.Max(1, (int)Math.Ceiling((eligibleAt - now).TotalDays));
            return new PeerReviewRequestEligibility { Message = $"You can request a review after 14 days in the project. Try again in {days} day(s)." };
        }

        if (lastRequestAt.HasValue)
        {
            var nextRequestAt = lastRequestAt.Value + RequestInterval;
            if (nextRequestAt > now)
            {
                var days = Math.Max(1, (int)Math.Ceiling((nextRequestAt - now).TotalDays));
                return new PeerReviewRequestEligibility { Message = $"You can request another review in {days} day(s)." };
            }
        }

        return new PeerReviewRequestEligibility
        {
            CanRequest = true,
            Message = "Request an anonymous review from your project teammates.",
        };
    }
}
