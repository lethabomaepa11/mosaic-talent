using Abp.UI;
using MosaicTalent.Services.DeveloperOnboardingService;
using NSubstitute;
using Shouldly;
using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace MosaicTalent.Tests.DeveloperOnboarding;

public class GithubSkillSuggestions_Tests
{
    private class Handler : HttpMessageHandler
    {
        public Func<HttpRequestMessage, HttpResponseMessage> Respond { get; set; }
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(Respond(request));
    }

    private static GithubSkillSuggestionService Create(Handler handler)
    {
        var factory = Substitute.For<IHttpClientFactory>();
        factory.CreateClient(Arg.Any<string>()).Returns(new HttpClient(handler));
        return new GithubSkillSuggestionService(factory);
    }

    [Fact]
    public async Task Should_Use_Current_Token_And_Exclude_Forks_And_Duplicate_Languages()
    {
        var handler = new Handler { Respond = request =>
        {
            request.Headers.Authorization.Parameter.ShouldBe("current-user-token");
            request.RequestUri.Query.ShouldContain("affiliation=owner");
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("[{\"language\":\"Python\",\"fork\":false},{\"language\":\"Python\"},{\"language\":\"C#\",\"fork\":true},{\"language\":null}]")
            };
        }};
        var skills = await Create(handler).GetSuggestionsAsync("current-user-token");
        skills.Count.ShouldBe(1);
        skills[0].ShouldBe("Python");
    }

    [Fact]
    public async Task Should_Report_Expired_Github_Access_Without_Inventing_Skills()
    {
        var handler = new Handler { Respond = _ => new HttpResponseMessage(HttpStatusCode.Unauthorized) };
        await Should.ThrowAsync<UserFriendlyException>(() => Create(handler).GetSuggestionsAsync("expired-token"));
    }
}
