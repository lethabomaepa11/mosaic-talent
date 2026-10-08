using MosaicTalent.Services.DeveloperOnboardingService;
using Shouldly;
using System.Collections.Generic;
using Xunit;

namespace MosaicTalent.Tests.DeveloperOnboarding;

public class ProfileFieldSuggestionEngine_Tests
{
    [Fact]
    public void BuildFallbackSuggestions_Should_Filter_Out_Existing_And_Apply_Query_For_Skills()
    {
        var tracks = new List<ProfileFieldSuggestionEngine.SuggestionTrack>
        {
            new()
            {
                Role = "Backend Engineer",
                RequiredSkills = new List<string> { "API Design", "PostgreSQL", "Testing" },
                SupportingSkills = new List<string> { "Docker" },
            },
        };

        var suggestions = ProfileFieldSuggestionEngine.BuildFallbackSuggestions(
            field: "skill",
            query: "api",
            existingValues: new List<string> { "API Design" },
            currentSkills: new List<string> { "React" },
            currentGoals: new List<string>(),
            tracks: tracks,
            maxResults: 8);

        suggestions.ShouldNotContain("API Design");
        foreach (var suggestion in suggestions)
        {
            suggestion.Contains("api", System.StringComparison.OrdinalIgnoreCase).ShouldBeTrue();
        }
    }

    [Fact]
    public void BuildFallbackSuggestions_Should_Return_Goals_With_Min_Length()
    {
        var tracks = new List<ProfileFieldSuggestionEngine.SuggestionTrack>
        {
            new()
            {
                Role = "Frontend Engineer",
                RequiredSkills = new List<string> { "Accessibility", "Performance" },
                SupportingSkills = new List<string> { "Testing" },
            },
        };

        var suggestions = ProfileFieldSuggestionEngine.BuildFallbackSuggestions(
            field: "goal",
            query: "",
            existingValues: new List<string>(),
            currentSkills: new List<string>(),
            currentGoals: new List<string>(),
            tracks: tracks,
            maxResults: 5);

        suggestions.Count.ShouldBeGreaterThan(0);
        foreach (var goal in suggestions)
        {
            goal.Length.ShouldBeGreaterThanOrEqualTo(12);
        }
    }

    [Fact]
    public void ParseAiSuggestions_Should_Read_Object_And_Array_Responses()
    {
        var objectResponse = "{\"suggestions\":[\"TypeScript\",\"React\"]}";
        var arrayResponse = "[\"Write clearer technical documentation\",\"Improve code review communication\"]";

        var objectSuggestions = ProfileFieldSuggestionEngine.ParseAiSuggestions(objectResponse);
        var arraySuggestions = ProfileFieldSuggestionEngine.ParseAiSuggestions(arrayResponse);

        objectSuggestions.ShouldBe(new List<string> { "TypeScript", "React" });
        arraySuggestions.ShouldContain("Write clearer technical documentation");
        arraySuggestions.ShouldContain("Improve code review communication");
    }
}
