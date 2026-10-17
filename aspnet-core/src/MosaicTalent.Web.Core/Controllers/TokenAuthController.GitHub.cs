using Abp.Authorization;
using Abp.Authorization.Users;
using Abp.MultiTenancy;
using Abp.Runtime.Security;
using MosaicTalent.Authentication.External;
using MosaicTalent.Authentication.JwtBearer;
using MosaicTalent.Authorization;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Models.TokenAuth;
using MosaicTalent.MultiTenancy;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.WebUtilities;

namespace MosaicTalent.Controllers
{
    public partial class TokenAuthController
    {
        [HttpGet]
        public IActionResult GitHubAuth([FromQuery] string mode = "login", [FromQuery] string returnPath = "")
        {
            if (!_gitHubOAuthService.IsConfigured())
            {
                return BadRequest("GitHub OAuth is not configured. Set GitHubOAuth:ClientId, GitHubOAuth:ClientSecret, and GitHubOAuth:RedirectUri.");
            }

            if (string.Equals(mode, "connect", StringComparison.OrdinalIgnoreCase))
            {
                // Legacy links first return to the frontend, where the bearer-authenticated
                // initiation endpoint can bind the connection to the current account.
                var path = returnPath != null && returnPath.StartsWith("/projects/") ? "/app" + returnPath : returnPath;
                return Redirect(_gitHubOAuthService.BuildSiteRedirect("/github/connect?returnPath=" +
                    Uri.EscapeDataString(GitHubConnectionTickets.SafeReturnPath(path))));
            }
            var oauthMode = "login";
            var normalizedReturnPath = NormalizeReturnPath(returnPath);

            var state = Guid.NewGuid().ToString("N");
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Path = "/",
                MaxAge = TimeSpan.FromMinutes(10)
            };

            Response.Cookies.Append(
                GitHubStateCookieName,
                state,
                cookieOptions);
            Response.Cookies.Append(
                GitHubModeCookieName,
                oauthMode,
                cookieOptions);
            Response.Cookies.Append(
                GitHubReturnPathCookieName,
                normalizedReturnPath,
                cookieOptions);

            return Redirect(_gitHubOAuthService.BuildAuthorizationUrl(
                state,
                includeRepositoryScope: oauthMode == "connect"));
        }

        [HttpGet]
        public async Task<IActionResult> GitHubCallback([FromQuery] string code, [FromQuery] string state, [FromQuery] string error)
        {
            var oauthMode = GetCookieOrDefault(GitHubModeCookieName, "login");
            var returnPath = NormalizeReturnPath(GetCookieOrDefault(GitHubReturnPathCookieName, string.Empty));

            Response.Cookies.Delete(GitHubModeCookieName, new CookieOptions { Path = "/" });
            Response.Cookies.Delete(GitHubReturnPathCookieName, new CookieOptions { Path = "/" });

            if (!string.IsNullOrWhiteSpace(error))
            {
                return Redirect(BuildOAuthRedirect(oauthMode, returnPath, "github_denied"));
            }

            if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
            {
                return Redirect(BuildOAuthRedirect(oauthMode, returnPath, "github_invalid_callback"));
            }

            if (!Request.Cookies.TryGetValue(GitHubStateCookieName, out var expectedState) || !string.Equals(expectedState, state, StringComparison.Ordinal))
            {
                return Redirect(BuildOAuthRedirect(oauthMode, returnPath, "github_invalid_state"));
            }

            Response.Cookies.Delete(GitHubStateCookieName, new CookieOptions { Path = "/" });

            var accessToken = await _gitHubOAuthService.ExchangeCodeForTokenAsync(code);
            if (string.IsNullOrWhiteSpace(accessToken))
            {
                return Redirect(BuildOAuthRedirect(oauthMode, returnPath, "github_token_exchange_failed"));
            }

            var gitHubUser = await _gitHubOAuthService.GetUserAsync(accessToken);
            if (gitHubUser == null)
            {
                return Redirect(BuildOAuthRedirect(oauthMode, returnPath, "github_profile_failed"));
            }

            var connection = oauthMode == "connect" ? ConnectionTickets.Read(state) : null;
            if (oauthMode == "connect" && connection == null)
                return Redirect(_gitHubOAuthService.BuildSiteRedirect("/onboarding?githubConnected=0&githubConnectError=github_invalid_state"));

            if (connection != null) returnPath = connection.ReturnPath;
            var emailAddress = oauthMode == "connect" ? "connected" : await _gitHubOAuthService.ResolveEmailAsync(accessToken, gitHubUser);
            if (string.IsNullOrWhiteSpace(emailAddress))
            {
                return Redirect(BuildOAuthRedirect(oauthMode, returnPath, "github_email_required"));
            }

            User user;
            try
            {
                user = connection == null
                    ? await _gitHubOAuthService.FindOrCreateTenantUserAsync(gitHubUser, emailAddress, accessToken)
                    : await _gitHubOAuthService.ConnectTenantUserAsync(connection.UserId, connection.TenantId, gitHubUser, accessToken);
            }
            catch (Abp.UI.UserFriendlyException)
            {
                return Redirect(BuildOAuthRedirect(oauthMode, returnPath, "github_connection_conflict"));
            }
            if (user == null)
            {
                return Redirect(BuildOAuthRedirect(oauthMode, returnPath, "github_user_failed"));
            }

            var principal = await _userClaimsPrincipalFactory.CreateAsync(user);
            var identity = principal.Identity as ClaimsIdentity;
            if (identity == null)
            {
                return Redirect(BuildOAuthRedirect(oauthMode, returnPath, "github_identity_failed"));
            }

            var appAccessToken = CreateAccessToken(CreateJwtClaims(identity));
            // Remove legacy names so localhost OAuth does not overwrite JS-managed frontend cookies with HttpOnly cookies.
            Response.Cookies.Delete(LegacyFrontendAccessTokenCookieName, new CookieOptions { Path = "/" });
            Response.Cookies.Delete(LegacyFrontendTenantCookieName, new CookieOptions { Path = "/" });

            Response.Cookies.Append(
                ServerAccessTokenCookieName,
                appAccessToken,
                BuildSessionCookieOptions());

            var tenantCookieValue = user.TenantId?.ToString()
                                    ?? (AbpSession.TenantId.HasValue ? AbpSession.TenantId.Value.ToString() : "host");
            Response.Cookies.Append(
                ServerTenantCookieName,
                tenantCookieValue,
                BuildSessionCookieOptions());

            return Redirect(BuildOAuthRedirect(oauthMode, returnPath, null, appAccessToken, tenantCookieValue));
        }

    }
}
