using Abp.Dependency;
using Abp.UI;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperOnboardingService;

public class GithubSkillSuggestionService : ITransientDependency
{
    private readonly IHttpClientFactory _httpClientFactory;

    public GithubSkillSuggestionService(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public async Task<List<string>> GetSuggestionsAsync(string accessToken)
    {
        var skills = new HashSet<string>(System.StringComparer.OrdinalIgnoreCase);
        var client = _httpClientFactory.CreateClient();
        client.Timeout = System.TimeSpan.FromSeconds(15);
        for (var page = 1; page <= 3; page++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get,
                $"https://api.github.com/user/repos?affiliation=owner&sort=pushed&per_page=100&page={page}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Headers.UserAgent.ParseAdd("MosaicTalent");
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
            using var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                throw new UserFriendlyException("GitHub skills could not be loaded. Reconnect GitHub or add your skills manually.");
            }
            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            if (document.RootElement.ValueKind != JsonValueKind.Array)
            {
                throw new UserFriendlyException("GitHub returned an unexpected response. Add your skills manually.");
            }
            foreach (var repo in document.RootElement.EnumerateArray())
            {
                if (repo.TryGetProperty("fork", out var fork) && fork.ValueKind == JsonValueKind.True) continue;
                if (repo.TryGetProperty("language", out var language) && language.ValueKind == JsonValueKind.String)
                {
                    var value = language.GetString()?.Trim();
                    if (!string.IsNullOrWhiteSpace(value)) skills.Add(value);
                }
            }
            if (document.RootElement.GetArrayLength() < 100) break;
        }
        return skills.OrderBy(x => x).ToList();
    }
}
