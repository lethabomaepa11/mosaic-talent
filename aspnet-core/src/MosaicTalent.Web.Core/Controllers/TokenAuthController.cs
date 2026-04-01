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
    public class TokenAuthController : MosaicTalentControllerBase
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
        private const string AccessTokenCookieName = "mosaic-talent.access-token";
        private const string TenantCookieName = "mosaic-talent.abp-tenant-id";

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
        public IActionResult GitHubAuth([FromQuery] string mode = "login", [FromQuery] string returnPath = "")
        {
            if (!_gitHubOAuthService.IsConfigured())
            {
                return BadRequest("GitHub OAuth is not configured. Set GitHubOAuth:ClientId, GitHubOAuth:ClientSecret, and GitHubOAuth:RedirectUri.");
            }

            var oauthMode = string.Equals(mode, "connect", StringComparison.OrdinalIgnoreCase)
                ? "connect"
                : "login";
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

            var emailAddress = await _gitHubOAuthService.ResolveEmailAsync(accessToken, gitHubUser);
            if (string.IsNullOrWhiteSpace(emailAddress))
            {
                return Redirect(BuildOAuthRedirect(oauthMode, returnPath, "github_email_required"));
            }

            var user = await _gitHubOAuthService.FindOrCreateTenantUserAsync(gitHubUser, emailAddress, accessToken);
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
            Response.Cookies.Append(
                AccessTokenCookieName,
                appAccessToken,
                new CookieOptions
                {
                    HttpOnly = false,
                    Secure = Request.IsHttps,
                    SameSite = SameSiteMode.Lax,
                    Path = "/"
                });

            var tenantCookieValue = user.TenantId?.ToString()
                                    ?? (AbpSession.TenantId.HasValue ? AbpSession.TenantId.Value.ToString() : "host");
            Response.Cookies.Append(
                TenantCookieName,
                tenantCookieValue,
                new CookieOptions
                {
                    HttpOnly = false,
                    Secure = Request.IsHttps,
                    SameSite = SameSiteMode.Lax,
                    Path = "/"
                });

            return Redirect(BuildOAuthRedirect(oauthMode, returnPath, null));
        }

        [HttpGet]
        public IActionResult GetAccessToken()
        {
            if (Request.Cookies.TryGetValue(AccessTokenCookieName, out var token) && !string.IsNullOrWhiteSpace(token))
            {
                return Ok(token);
            }
            return Ok(string.Empty);
        }

        private string BuildOAuthRedirect(string mode, string returnPath, string errorCode)
        {
            if (!string.Equals(mode, "connect", StringComparison.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(errorCode))
                {
                    return _gitHubOAuthService.BuildClientRedirect($"login?oauthError={errorCode}");
                }

                return _gitHubOAuthService.BuildClientRedirect(string.Empty);
            }

            var normalizedPath = NormalizeReturnPath(returnPath);
            var query = new Dictionary<string, string>
            {
                ["githubConnected"] = string.IsNullOrWhiteSpace(errorCode) ? "1" : "0",
            };

            if (!string.IsNullOrWhiteSpace(errorCode))
            {
                query["githubConnectError"] = errorCode;
            }

            var suffix = QueryHelpers.AddQueryString(normalizedPath, query);
            suffix = suffix.TrimStart('/');
            if (suffix.StartsWith("app/", StringComparison.OrdinalIgnoreCase))
            {
                suffix = suffix.Substring("app/".Length);
            }

            return _gitHubOAuthService.BuildClientRedirect(suffix);
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
