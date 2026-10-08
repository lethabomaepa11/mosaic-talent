using Abp.UI;
using Microsoft.AspNetCore.Mvc;
using MosaicTalent.Services.DeveloperOnboardingService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperOnboardingService;

public partial class DeveloperOnboardingAppService
{
    [HttpPost]
    public async Task<ProfileFieldSuggestionsDto> GetProfileFieldSuggestions(
        GetProfileFieldSuggestionsInput input)
    {
        var field = NormalizeSuggestionField(input?.Field);
        var query = (input?.Query ?? string.Empty).Trim();
        var existingValues = input?.ExistingValues ?? new List<string>();
        var maxResults = Math.Clamp(input?.MaxResults ?? 8, 1, 12);

        var context = await BuildLearningPathContext();
        var tracks = ResolveMarketTracks(context.Goals)
            .Select(track => new ProfileFieldSuggestionEngine.SuggestionTrack
            {
                Role = track.Role,
                RequiredSkills = track.RequiredSkills,
                SupportingSkills = track.SupportingSkills,
            })
            .ToList();

        var fallbackSuggestions = ProfileFieldSuggestionEngine.BuildFallbackSuggestions(
            field,
            query,
            existingValues,
            context.Skills,
            context.Goals,
            tracks,
            maxResults);

        if (!_groqChatService.IsConfigured())
        {
            return new ProfileFieldSuggestionsDto
            {
                Field = field,
                Query = query,
                Source = "fallback",
                Suggestions = fallbackSuggestions,
            };
        }

        var aiSuggestions = await TryGenerateProfileFieldSuggestionsWithAi(
            field,
            query,
            existingValues,
            maxResults,
            context,
            tracks);

        if (aiSuggestions.Count == 0)
        {
            return new ProfileFieldSuggestionsDto
            {
                Field = field,
                Query = query,
                Source = "fallback",
                Suggestions = fallbackSuggestions,
            };
        }

        return new ProfileFieldSuggestionsDto
        {
            Field = field,
            Query = query,
            Source = "ai",
            Suggestions = aiSuggestions,
        };
    }

    private async Task<List<string>> TryGenerateProfileFieldSuggestionsWithAi(
        string field,
        string query,
        List<string> existingValues,
        int maxResults,
        LearningPathContext context,
        List<ProfileFieldSuggestionEngine.SuggestionTrack> tracks)
    {
        var payload = new
        {
            field,
            query,
            maxResults,
            existingValues = NormalizeTextValues(existingValues),
            profile = new
            {
                yearsOfExperience = context.YearsOfExperience,
                yearOfStudy = context.YearOfStudy,
                studyLevel = context.StudyLevel,
                skills = context.Skills,
                goals = context.Goals,
            },
            marketTracks = tracks.Select(track => new
            {
                role = track.Role,
                requiredSkills = track.RequiredSkills,
                supportingSkills = track.SupportingSkills,
            }),
        };

        var systemPrompt =
            "You generate concise developer profile suggestions. " +
            "Return only JSON: {\"suggestions\":[\"...\"]}. " +
            "If field is 'skill', return short skill names only (2-40 chars). " +
            "If field is 'goal', return specific learning goals (at least 12 chars). " +
            "Do not include duplicates, and exclude existing values.";

        var response = await _groqChatService.TryCompleteAsync(
            systemPrompt,
            JsonSerializer.Serialize(payload));

        var parsed = ProfileFieldSuggestionEngine.ParseAiSuggestions(response);
        return ProfileFieldSuggestionEngine.ApplySuggestionConstraints(
            parsed,
            field,
            query,
            existingValues,
            maxResults);
    }

    private static string NormalizeSuggestionField(string field)
    {
        if (string.Equals((field ?? string.Empty).Trim(), "goal", StringComparison.OrdinalIgnoreCase))
        {
            return "goal";
        }

        if (string.Equals((field ?? string.Empty).Trim(), "skill", StringComparison.OrdinalIgnoreCase))
        {
            return "skill";
        }

        throw new UserFriendlyException("Field must be 'skill' or 'goal'.");
    }
}
