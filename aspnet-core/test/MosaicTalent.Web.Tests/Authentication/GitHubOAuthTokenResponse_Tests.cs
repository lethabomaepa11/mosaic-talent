using MosaicTalent.Models.TokenAuth;
using Shouldly;
using System.Text.Json;
using Xunit;

namespace MosaicTalent.Web.Tests.Authentication;

public class GitHubOAuthTokenResponse_Tests
{
    [Fact]
    public void Should_Deserialize_SnakeCase_GitHub_Token_Response()
    {
        const string responseJson = "{\"access_token\":\"gho_test\",\"token_type\":\"bearer\",\"scope\":\"read:user user:email\"}";

        var model = JsonSerializer.Deserialize<GitHubOAuthTokenResponse>(
            responseJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        model.ShouldNotBeNull();
        model.AccessToken.ShouldBe("gho_test");
        model.TokenType.ShouldBe("bearer");
        model.Scope.ShouldBe("read:user user:email");
    }
}
