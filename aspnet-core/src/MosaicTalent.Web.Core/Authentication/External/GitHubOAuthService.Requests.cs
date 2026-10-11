using Abp;
using Abp.Authorization.Users;
using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.IdentityFramework;
using Abp.Runtime.Session;
using MosaicTalent.Authorization.Roles;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Models.TokenAuth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.WebUtilities;
using Abp.Runtime.Security;

namespace MosaicTalent.Authentication.External
{
    public partial class GitHubOAuthService
    {
        public string BuildAuthorizationUrl(string state, bool includeRepositoryScope = false)
        {
            var clientId = _appConfiguration["GitHubOAuth:ClientId"];
            var redirectUri = _appConfiguration["GitHubOAuth:RedirectUri"];
            var scope = includeRepositoryScope
                ? "read:user user:email repo"
                : "read:user user:email";

            return
                "https://github.com/login/oauth/authorize" +
                "?client_id=" + Uri.EscapeDataString(clientId) +
                "&redirect_uri=" + Uri.EscapeDataString(redirectUri) +
                "&scope=" + Uri.EscapeDataString(scope) +
                "&state=" + Uri.EscapeDataString(state);
        }

        public async Task<string> ExchangeCodeForTokenAsync(string code)
        {
            var clientId = _appConfiguration["GitHubOAuth:ClientId"];
            var clientSecret = _appConfiguration["GitHubOAuth:ClientSecret"];
            var redirectUri = _appConfiguration["GitHubOAuth:RedirectUri"];

            var httpClient = _httpClientFactory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Post, "https://github.com/login/oauth/access_token")
            {
                Content = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    { "client_id", clientId },
                    { "client_secret", clientSecret },
                    { "code", code },
                    { "redirect_uri", redirectUri }
                })
            };
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            using (var response = await httpClient.SendAsync(request))
            {
                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                return ExtractAccessToken(content);
            }
        }

        public async Task<GitHubOAuthUserResponse> GetUserAsync(string accessToken)
        {
            var httpClient = _httpClientFactory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Headers.UserAgent.ParseAdd("MosaicTalent");
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));

            using (var response = await httpClient.SendAsync(request))
            {
                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<GitHubOAuthUserResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
        }

        public async Task<string> ResolveEmailAsync(string accessToken, GitHubOAuthUserResponse user)
        {
            if (!string.IsNullOrWhiteSpace(user?.Email))
            {
                return user.Email;
            }

            var httpClient = _httpClientFactory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user/emails");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Headers.UserAgent.ParseAdd("MosaicTalent");
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));

            using (var response = await httpClient.SendAsync(request))
            {
                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                var emails = JsonSerializer.Deserialize<List<GitHubOAuthUserEmailResponse>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<GitHubOAuthUserEmailResponse>();
                var primaryVerifiedEmail = emails.FirstOrDefault(e => e.Primary && e.Verified);
                if (primaryVerifiedEmail != null && !string.IsNullOrWhiteSpace(primaryVerifiedEmail.Email))
                {
                    return primaryVerifiedEmail.Email;
                }

                var anyVerifiedEmail = emails.FirstOrDefault(e => e.Verified);
                return anyVerifiedEmail?.Email;
            }
        }

    }
}
