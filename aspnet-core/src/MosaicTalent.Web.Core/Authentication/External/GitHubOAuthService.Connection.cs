using Abp.Domain.Uow;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Models.TokenAuth;
using System;
using System.Threading.Tasks;

namespace MosaicTalent.Authentication.External
{
    public partial class GitHubOAuthService
    {
        [UnitOfWork]
        public async Task<User> ConnectTenantUserAsync(long userId, int? tenantId, GitHubOAuthUserResponse githubUser, string accessToken)
        {
            using (CurrentUnitOfWork.SetTenantId(tenantId))
            {
                var user = await _userManager.Users.FirstOrDefaultAsync(x => x.Id == userId && x.TenantId == tenantId);
                if (user == null || !user.IsActive || string.IsNullOrWhiteSpace(githubUser?.Login))
                    throw new UserFriendlyException("The signed-in account is unavailable.");

                var login = githubUser.Login.ToUpperInvariant();
                var owner = await _developerRepository.GetAll()
                    .FirstOrDefaultAsync(x => x.GithubUsername != null && x.GithubUsername.ToUpper() == login && x.UserId != userId);
                if (owner != null)
                    throw new UserFriendlyException("This GitHub account is already connected to another user.");

                var developer = await _developerRepository.GetAll().FirstOrDefaultAsync(x => x.UserId == userId);
                if (developer != null && !string.IsNullOrWhiteSpace(developer.GithubUsername)
                    && !string.Equals(developer.GithubUsername, githubUser.Login, StringComparison.OrdinalIgnoreCase))
                    throw new UserFriendlyException("Reconnect the GitHub account already linked to your profile.");

                await UpsertDeveloperAsync(userId, githubUser, accessToken);
                return user;
            }
        }

        public string BuildSiteRedirect(string path)
        {
            return (_appConfiguration["App:ClientRootAddress"] ?? string.Empty).TrimEnd('/') + path;
        }
    }
}
