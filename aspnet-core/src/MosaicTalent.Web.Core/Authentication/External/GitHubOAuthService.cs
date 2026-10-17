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
    public partial class GitHubOAuthService : AbpServiceBase, ITransientDependency
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
            var clientRootAddress = (_appConfiguration["App:ClientRootAddress"] ?? string.Empty).TrimEnd('/');
            return clientRootAddress + "/app";
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

        private async Task UpsertDeveloperAsync(long userId, GitHubOAuthUserResponse gitHubUser, string accessToken)
        {
            var githubUsername = gitHubUser?.Login?.ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(githubUsername))
            {
                return;
            }

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user != null)
            {
                user.AvatarUrl = gitHubUser?.AvatarUrl;
                var updateResult = await _userManager.UpdateAsync(user);
                updateResult.CheckErrors(LocalizationManager);
            }

            var developer = await _developerRepository.GetAll()
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (developer == null)
            {
                await _developerRepository.InsertAsync(new Developer
                {
                    UserId = userId,
                    GithubUsername = githubUsername,
                    GithubAccessTokenEncrypted = string.IsNullOrWhiteSpace(accessToken)
                        ? null
                        : SimpleStringCipher.Instance.Encrypt(accessToken),
                    GithubAccessTokenUpdatedAt = string.IsNullOrWhiteSpace(accessToken)
                        ? (DateTime?)null
                        : DateTime.UtcNow,
                });
                return;
            }

            developer.GithubUsername = githubUsername;
            if (!string.IsNullOrWhiteSpace(accessToken))
            {
                developer.GithubAccessTokenEncrypted = SimpleStringCipher.Instance.Encrypt(accessToken);
                developer.GithubAccessTokenUpdatedAt = DateTime.UtcNow;
            }
            await _developerRepository.UpdateAsync(developer);
        }
    }
}
