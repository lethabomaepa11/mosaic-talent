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
        [UnitOfWork]
        public async Task<User> FindOrCreateTenantUserAsync(GitHubOAuthUserResponse gitHubUser, string emailAddress, string accessToken)
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
                        await UpsertDeveloperAsync(existingUserByGithub.Id, gitHubUser, accessToken);
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
                    await UpsertDeveloperAsync(existingUser.Id, gitHubUser, accessToken);
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
                    AvatarUrl = gitHubUser?.AvatarUrl,
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

                await UpsertDeveloperAsync(user.Id, gitHubUser, accessToken);

                return user;
            }
        }

    }
}
