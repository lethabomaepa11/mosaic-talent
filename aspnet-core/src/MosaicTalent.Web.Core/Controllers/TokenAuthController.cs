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
    [Route("api/[controller]/[action]")]
    public partial class TokenAuthController : MosaicTalentControllerBase
    {
        private readonly LogInManager _logInManager;
        private readonly ITenantCache _tenantCache;
        private readonly AbpLoginResultTypeHelper _abpLoginResultTypeHelper;
        private readonly TokenAuthConfiguration _configuration;
        private readonly UserClaimsPrincipalFactory _userClaimsPrincipalFactory;
        private readonly GitHubOAuthService _gitHubOAuthService;

        private const string GitHubStateCookieName = "mosaic-talent.github-oauth-state";
        private const string GitHubModeCookieName = "mosaic-talent.github-oauth-mode";
        private const string GitHubReturnPathCookieName = "mosaic-talent.github-oauth-return-path";
        private const string ServerAccessTokenCookieName = "mosaic-talent.server-access-token";
        private const string ServerTenantCookieName = "mosaic-talent.server-abp-tenant-id";
        private const string LegacyFrontendAccessTokenCookieName = "mosaic-talent.access-token";
        private const string LegacyFrontendTenantCookieName = "mosaic-talent.abp-tenant-id";

        public TokenAuthController(
            LogInManager logInManager,
            ITenantCache tenantCache,
            AbpLoginResultTypeHelper abpLoginResultTypeHelper,
            TokenAuthConfiguration configuration,
            UserClaimsPrincipalFactory userClaimsPrincipalFactory,
            GitHubOAuthService gitHubOAuthService)
        {
            _logInManager = logInManager;
            _tenantCache = tenantCache;
            _abpLoginResultTypeHelper = abpLoginResultTypeHelper;
            _configuration = configuration;
            _userClaimsPrincipalFactory = userClaimsPrincipalFactory;
            _gitHubOAuthService = gitHubOAuthService;
        }

        [HttpPost]
        public async Task<AuthenticateResultModel> Authenticate([FromBody] AuthenticateModel model)
        {
            var loginResult = await GetLoginResultAsync(
                model.UserNameOrEmailAddress,
                model.Password,
                GetTenancyNameOrNull());

            var accessToken = CreateAccessToken(CreateJwtClaims(loginResult.Identity));

            return new AuthenticateResultModel
            {
                AccessToken = accessToken,
                EncryptedAccessToken = GetEncryptedAccessToken(accessToken),
                ExpireInSeconds = (int)_configuration.Expiration.TotalSeconds,
                UserId = loginResult.User.Id
            };
        }

        [HttpGet]
        public IActionResult GetAccessToken()
        {
            if (Request.Cookies.TryGetValue(ServerAccessTokenCookieName, out var token) && !string.IsNullOrWhiteSpace(token))
            {
                return Ok(token);
            }

            if (Request.Cookies.TryGetValue(LegacyFrontendAccessTokenCookieName, out token) && !string.IsNullOrWhiteSpace(token))
            {
                return Ok(token);
            }
            return Ok(string.Empty);
        }

        [HttpPost]
        [AbpAllowAnonymous]
        public IActionResult Logout()
        {
            var cookieOptions = BuildSessionCookieOptions();
            Response.Cookies.Delete(ServerAccessTokenCookieName, cookieOptions);
            Response.Cookies.Delete(ServerTenantCookieName, cookieOptions);
            Response.Cookies.Delete(LegacyFrontendAccessTokenCookieName, cookieOptions);
            Response.Cookies.Delete(LegacyFrontendTenantCookieName, cookieOptions);
            return Ok();
        }

        private string BuildOAuthRedirect(
            string mode,
            string returnPath,
            string errorCode,
            string appAccessToken = null,
            string tenantCookieValue = null)
        {
            if (!string.Equals(mode, "connect", StringComparison.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(errorCode))
                {
                    return _gitHubOAuthService.BuildClientRedirect($"login?oauthError={errorCode}");
                }

                var redirectUrl = _gitHubOAuthService.BuildClientRedirect(string.Empty);
                if (string.IsNullOrWhiteSpace(appAccessToken))
                {
                    return redirectUrl;
                }

                var encodedToken = Uri.EscapeDataString(appAccessToken);
                var encodedTenant = Uri.EscapeDataString(tenantCookieValue ?? "host");
                return $"{redirectUrl}#oauthAccessToken={encodedToken}&oauthTenantId={encodedTenant}";
            }

            var normalizedPath = GitHubConnectionTickets.SafeReturnPath(returnPath.StartsWith("/projects/") ? "/app" + returnPath : returnPath);
            var query = new Dictionary<string, string>
            {
                ["githubConnected"] = string.IsNullOrWhiteSpace(errorCode) ? "1" : "0",
            };
            if (!string.IsNullOrWhiteSpace(errorCode)) query["githubConnectError"] = errorCode;
            return _gitHubOAuthService.BuildSiteRedirect(QueryHelpers.AddQueryString(normalizedPath, query));
        }

        private static string NormalizeReturnPath(string returnPath)
        {
            if (string.IsNullOrWhiteSpace(returnPath))
            {
                return "/projects/my?create=true";
            }

            if (Uri.TryCreate(returnPath, UriKind.Relative, out var _))
            {
                if (returnPath.StartsWith("//", StringComparison.Ordinal))
                {
                    return "/projects/my?create=true";
                }

                return returnPath.StartsWith("/")
                    ? returnPath
                    : "/" + returnPath;
            }

            return "/projects/my?create=true";
        }

        private string GetCookieOrDefault(string cookieName, string fallback)
        {
            if (!Request.Cookies.TryGetValue(cookieName, out var value))
            {
                return fallback;
            }

            return string.IsNullOrWhiteSpace(value) ? fallback : value;
        }

        private CookieOptions BuildSessionCookieOptions()
        {
            var isHttps = Request.IsHttps;
            return new CookieOptions
            {
                HttpOnly = true,
                Secure = isHttps,
                SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
                Path = "/"
            };
        }

        private string GetTenancyNameOrNull()
        {
            if (!AbpSession.TenantId.HasValue)
            {
                return null;
            }

            return _tenantCache.GetOrNull(AbpSession.TenantId.Value)?.TenancyName;
        }

        private async Task<AbpLoginResult<Tenant, User>> GetLoginResultAsync(string usernameOrEmailAddress, string password, string tenancyName)
        {
            var loginResult = await _logInManager.LoginAsync(usernameOrEmailAddress, password, tenancyName);

            switch (loginResult.Result)
            {
                case AbpLoginResultType.Success:
                    return loginResult;
                default:
                    throw _abpLoginResultTypeHelper.CreateExceptionForFailedLoginAttempt(loginResult.Result, usernameOrEmailAddress, tenancyName);
            }
        }

        private string CreateAccessToken(IEnumerable<Claim> claims, TimeSpan? expiration = null)
        {
            var now = DateTime.UtcNow;

            var jwtSecurityToken = new JwtSecurityToken(
                issuer: _configuration.Issuer,
                audience: _configuration.Audience,
                claims: claims,
                notBefore: now,
                expires: now.Add(expiration ?? _configuration.Expiration),
                signingCredentials: _configuration.SigningCredentials);

            return new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken);
        }

        private static List<Claim> CreateJwtClaims(ClaimsIdentity identity)
        {
            var claims = identity.Claims.ToList();
            var nameIdClaim = claims.First(c => c.Type == ClaimTypes.NameIdentifier);

            claims.AddRange(new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, nameIdClaim.Value),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.Now.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            });

            return claims;
        }

        private string GetEncryptedAccessToken(string accessToken)
        {
            return SimpleStringCipher.Instance.Encrypt(accessToken);
        }
    }
}
