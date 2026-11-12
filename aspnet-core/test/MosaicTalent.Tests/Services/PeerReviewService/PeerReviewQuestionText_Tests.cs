using MosaicTalent.Services.PeerReviewService;
using Shouldly;
using Xunit;

namespace MosaicTalent.Tests.Services.PeerReviewService;

public class PeerReviewQuestionText_Tests
{
    [Fact]
    public void Does_not_redact_the_anonymous_placeholder_repeatedly()
    {
        PeerReviewQuestionText.Sanitize("How did your anonymous teammate collaborate during Journey notebook abc?", "Journey notebook abc", "Journey Owner abc", "Journey Teammate abc")
            .ShouldBe("How did your anonymous teammate collaborate during this project?");
    }
    [Fact]
    public void Replaces_names_once_at_word_boundaries()
    {
        PeerReviewQuestionText.Sanitize("Did Ann help Hannah and Anna?", "Project", "Ann", "Hannah")
            .ShouldBe("Did your anonymous teammate help your anonymous teammate and Anna?");
    }
    [Fact]
    public void Handles_overlapping_names_and_preserves_existing_neutral_language()
    {
        PeerReviewQuestionText.Sanitize("Alex Smith helped your teammate during this project.", "Notebook", "Alex Smith", "Smith")
            .ShouldBe("your anonymous teammate helped your teammate during this project.");
    }
}
