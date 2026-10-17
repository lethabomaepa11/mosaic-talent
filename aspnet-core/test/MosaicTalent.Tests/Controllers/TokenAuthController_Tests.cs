using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MosaicTalent.Controllers;
using Shouldly;
using System;
using System.Linq;
using Xunit;

namespace MosaicTalent.Tests.Controllers;

public class TokenAuthController_Tests
{
    [Fact]
    public void Logout_expires_server_and_legacy_auth_cookies()
    {
        var context = new DefaultHttpContext();
        var controller = new TokenAuthController(null, null, null, null, null, null)
        {
            ControllerContext = new ControllerContext { HttpContext = context }
        };

        controller.Logout().ShouldBeOfType<OkResult>();

        var cookies = context.Response.Headers["Set-Cookie"].ToArray();
        var expectedNames = new[]
        {
            "mosaic-talent.server-access-token",
            "mosaic-talent.server-abp-tenant-id",
            "mosaic-talent.access-token",
            "mosaic-talent.abp-tenant-id"
        };

        foreach (var name in expectedNames)
        {
            var cookie = cookies.Single(value => value.StartsWith(name + "=", StringComparison.Ordinal));
            cookie.ShouldContain("path=/", Case.Insensitive);
            cookie.ShouldContain("expires=", Case.Insensitive);
        }
    }
}
