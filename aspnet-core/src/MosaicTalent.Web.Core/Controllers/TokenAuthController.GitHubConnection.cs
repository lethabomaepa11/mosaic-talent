using Abp.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MosaicTalent.Authentication.External;
using System;

namespace MosaicTalent.Controllers
{
    public class GitHubConnectionInput
    {
        public string ReturnPath { get; set; }
    }

    public partial class TokenAuthController
    {
        public GitHubConnectionTickets ConnectionTickets { get; set; }

        [AbpAuthorize]
        [HttpPost]
        public IActionResult BeginGitHubConnection([FromBody] GitHubConnectionInput input)
        {
            if (!AbpSession.UserId.HasValue) return Unauthorized();
            if (!_gitHubOAuthService.IsConfigured()) return BadRequest("GitHub OAuth is not configured.");

            var state = ConnectionTickets.Issue(AbpSession.UserId.Value, AbpSession.TenantId, input?.ReturnPath);
            var options = new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = Request.IsHttps ? SameSiteMode.None : SameSiteMode.Lax,
                Path = "/",
                MaxAge = TimeSpan.FromMinutes(10),
            };
            Response.Cookies.Append(GitHubStateCookieName, state, options);
            Response.Cookies.Append(GitHubModeCookieName, "connect", options);
            Response.Cookies.Append(GitHubReturnPathCookieName, GitHubConnectionTickets.SafeReturnPath(input?.ReturnPath), options);
            return Ok(new { AuthorizationUrl = _gitHubOAuthService.BuildAuthorizationUrl(state, true) });
        }
    }
}
