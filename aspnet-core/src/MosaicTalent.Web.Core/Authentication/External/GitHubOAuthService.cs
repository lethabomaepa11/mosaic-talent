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

namespace MosaicTalent.Authentication.External
{
    public class GitHubOAuthService : AbpServiceBase, ITransientDependency
    {
        private readonly UserManager _userManager;
        private readonly RoleManager _roleManager;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _appConfiguration;
        private readonly IAbpSession _abpSession;
        private readonly IRepository<Developer, Guid> _developerRepository;

        public GitHubOAuthService(
            UserManager userManager,
            RoleManager roleManager,
            IHttpClientFactory httpClientFactory,
            IConfiguration appConfiguration,
            IAbpSession abpSession,
            IRepository<Developer, Guid> developerRepository)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _httpClientFactory = httpClientFactory;
            _appConfiguration = appConfiguration;
            _abpSession = abpSession;
            _developerRepository = developerRepository;

            LocalizationSourceName = MosaicTalentConsts.LocalizationSourceName;
        }

        public bool IsConfigured()
        {
            return !string.IsNullOrWhiteSpace(_appConfiguration["GitHubOAuth:ClientId"])
                && !string.IsNullOrWhiteSpace(_appConfiguration["GitHubOAuth:ClientSecret"])
                && !string.IsNullOrWhiteSpace(_appConfiguration["GitHubOAuth:RedirectUri"]);
        }

        public string GetClientRootAddress()
        {
            return _appConfiguration["App:ClientRootAddress"] + "/onboarding";
        }

        public string BuildAuthorizationUrl(string state)
        {
            var clientId = _appConfiguration["GitHubOAuth:ClientId"];
            var redirectUri = _appConfiguration["GitHubOAuth:RedirectUri"];

            return
                "https://github.com/login/oauth/authorize" +
                "?client_id=" + Uri.EscapeDataString(clientId) +
                "&redirect_uri=" + Uri.EscapeDataString(redirectUri) +
                "&scope=" + Uri.EscapeDataString("read:user user:email") +
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

        [UnitOfWork]
        public async Task<User> FindOrCreateTenantUserAsync(GitHubOAuthUserResponse gitHubUser, string emailAddress)
        {
            var tenantId = _abpSession.TenantId ?? 1;
            var normalizedEmail = emailAddress?.Trim().ToUpperInvariant();
            var normalizedGithubLogin = gitHubUser?.Login?.Trim().ToUpperInvariant();

            using (CurrentUnitOfWork.SetTenantId(tenantId))
            {
                if (!string.IsNullOrWhiteSpace(normalizedGithubLogin))
                {
                    var existingDeveloper = await _developerRepository.GetAll()
                        .Where(d => d.GithubUsername != null && d.GithubUsername.ToUpper() == normalizedGithubLogin)
                        .FirstOrDefaultAsync();

                    var existingUserByGithub = existingDeveloper == null
                        ? null
                        : await _userManager.Users
                            .Where(u => u.Id == existingDeveloper.UserId && u.TenantId == tenantId)
                            .FirstOrDefaultAsync();

                    if (existingUserByGithub != null)
                    {
                        await UpsertDeveloperAsync(existingUserByGithub.Id, gitHubUser);
                        return existingUserByGithub;
                    }
                }

                var existingUser = await _userManager.Users
                    .Where(u => u.TenantId == tenantId
                                && (
                                    u.NormalizedEmailAddress == normalizedEmail
                                    || (u.EmailAddress != null && u.EmailAddress.ToUpper() == normalizedEmail)
                                ))
                    .FirstOrDefaultAsync();
                if (existingUser != null)
                {
                    await UpsertDeveloperAsync(existingUser.Id, gitHubUser);
                    return existingUser;
                }

                var loginName = !string.IsNullOrWhiteSpace(gitHubUser?.Login)
                    ? gitHubUser.Login
                    : Regex.Replace(emailAddress.Split('@')[0], "[^a-zA-Z0-9_.-]", string.Empty);

                if (string.IsNullOrWhiteSpace(loginName))
                {
                    loginName = "githubuser";
                }

                var uniqueUserName = await EnsureUniqueUserNameAsync(loginName);
                var names = ResolveNames(gitHubUser?.Name);

                var user = new User
                {
                    TenantId = tenantId,
                    Name = names.Item1,
                    Surname = names.Item2,
                    EmailAddress = emailAddress,
                    IsActive = true,
                    UserName = uniqueUserName,
                    IsEmailConfirmed = true,
                    Roles = new List<UserRole>()
                };

                user.SetNormalizedNames();

                var defaultRoles = await _roleManager.Roles
                    .Where(r => r.IsDefault && r.TenantId == tenantId)
                    .ToListAsync();

                foreach (var defaultRole in defaultRoles)
                {
                    user.Roles.Add(new UserRole(tenantId, user.Id, defaultRole.Id));
                }

                await _userManager.InitializeOptionsAsync(tenantId);
                var createResult = await _userManager.CreateAsync(user, User.CreateRandomPassword());
                createResult.CheckErrors(LocalizationManager);

                await UpsertDeveloperAsync(user.Id, gitHubUser);

                return user;
            }
        }

        public string BuildClientRedirect(string suffix)
        {
            var clientRootAddress = GetClientRootAddress();
            if (string.IsNullOrWhiteSpace(suffix))
            {
                return clientRootAddress;
            }

            if (clientRootAddress.EndsWith("/"))
            {
                return clientRootAddress + suffix;
            }

            return clientRootAddress + "/" + suffix;
        }

        private async Task<string> EnsureUniqueUserNameAsync(string baseUserName)
        {
            var candidate = baseUserName;
            var suffix = 0;

            while (await _userManager.FindByNameAsync(candidate) != null)
            {
                suffix++;
                candidate = baseUserName + suffix;
            }

            return candidate;
        }

        private static Tuple<string, string> ResolveNames(string gitHubName)
        {
            var firstName = "GitHub";
            var lastName = "User";

            if (string.IsNullOrWhiteSpace(gitHubName))
            {
                return Tuple.Create(firstName, lastName);
            }

            var nameParts = gitHubName.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
            if (nameParts.Length > 0)
            {
                firstName = nameParts[0];
            }

            if (nameParts.Length > 1)
            {
                lastName = string.Join(" ", nameParts.Skip(1));
            }

            return Tuple.Create(firstName, lastName);
        }

        private static string ExtractAccessToken(string content)
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                return null;
            }

            if (content.TrimStart().StartsWith("{"))
            {
                var tokenResponse = JsonSerializer.Deserialize<GitHubOAuthTokenResponse>(
                    content,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return tokenResponse?.AccessToken;
            }

            var form = QueryHelpers.ParseQuery(content);
            if (form.TryGetValue("access_token", out var accessToken))
            {
                return accessToken.ToString();
            }

            return null;
        }

        private async Task UpsertDeveloperAsync(long userId, GitHubOAuthUserResponse gitHubUser)
        {
            var githubUsername = gitHubUser?.Login;
            if (string.IsNullOrWhiteSpace(githubUsername))
            {
                return;
            }

            var developer = await _developerRepository.GetAll()
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (developer == null)
            {
                await _developerRepository.InsertAsync(new Developer
                {
                    UserId = userId,
                    GithubUsername = githubUsername,
                    AvatarUrl = gitHubUser?.AvatarUrl
                });
                return;
            }

            developer.GithubUsername = githubUsername;
            developer.AvatarUrl = gitHubUser?.AvatarUrl;
            await _developerRepository.UpdateAsync(developer);
        }
    }
}
