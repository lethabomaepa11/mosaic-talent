using Microsoft.AspNetCore.DataProtection;
using MosaicTalent.Authentication.External;
using Shouldly;
using System;
using System.Text.Json;
using Xunit;

namespace MosaicTalent.Tests.Authentication;

public class GitHubConnectionTickets_Tests
{
    [Fact]
    public void Should_Bind_State_To_User_Tenant_And_Safe_Return_Path()
    {
        var service = new GitHubConnectionTickets(new EphemeralDataProtectionProvider());
        var ticket = service.Read(service.Issue(42, 1, "/onboarding"));
        ticket.UserId.ShouldBe(42);
        ticket.TenantId.ShouldBe(1);
        ticket.ReturnPath.ShouldBe("/onboarding");
    }

    [Fact]
    public void Should_Reject_Tampered_And_Expired_Tickets()
    {
        var provider = new EphemeralDataProtectionProvider();
        var service = new GitHubConnectionTickets(provider);
        service.Read(service.Issue(42, 1, "/onboarding") + "tampered").ShouldBeNull();
        var expired = provider.CreateProtector("MosaicTalent.GitHubConnection.v1").Protect(JsonSerializer.Serialize(new GitHubConnectionTicket
        {
            UserId = 42, ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(-1).ToUnixTimeSeconds(),
        }));
        service.Read(expired).ShouldBeNull();
    }

    [Theory]
    [InlineData("https://evil.example/")]
    [InlineData("//evil.example/")]
    [InlineData("/app/../outside")]
    public void Should_Reject_Unapproved_Return_Paths(string path)
    {
        var service = new GitHubConnectionTickets(new EphemeralDataProtectionProvider());
        service.Read(service.Issue(42, 1, path)).ReturnPath.ShouldBe("/onboarding");
    }
}
