using Abp.UI;
using Castle.MicroKernel.Registration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MosaicTalent.Authentication.External;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Models.TokenAuth;
using NSubstitute;
using Shouldly;
using System.Threading.Tasks;
using Xunit;

namespace MosaicTalent.Tests.Authentication;

public class GitHubAccountConnection_Tests : MosaicTalentTestBase
{
    public GitHubAccountConnection_Tests()
    {
        LocalIocManager.IocContainer.Register(
            Component.For<IConfiguration>().Instance(new ConfigurationBuilder().AddInMemoryCollection().Build()),
            Component.For<System.Net.Http.IHttpClientFactory>().Instance(Substitute.For<System.Net.Http.IHttpClientFactory>()));
    }

    [Fact]
    public async Task Should_Link_To_Signed_In_User_Even_When_Github_Email_Differs()
    {
        var userId = AbpSession.UserId.Value;
        await WithUnitOfWorkAsync(async () =>
        {
            var result = await Resolve<GitHubOAuthService>().ConnectTenantUserAsync(userId, 1,
                new GitHubOAuthUserResponse { Login = "connected-user", Email = "different@example.com" }, "token");
            result.Id.ShouldBe(userId);
        });
        await UsingDbContextAsync(async context =>
        {
            var developer = await context.Developers.FirstOrDefaultAsync(x => x.UserId == userId);
            developer.GithubUsername.ShouldBe("connected-user");
            developer.GithubAccessTokenEncrypted.ShouldNotBeNullOrEmpty();
        });
    }

    [Fact]
    public async Task Should_Reject_A_Github_Identity_That_Belongs_To_Another_User()
    {
        await UsingDbContextAsync(async context =>
        {
            var owner = new User { TenantId = 1, UserName = "owner", Name = "Owner", Surname = "User", EmailAddress = "owner@example.com", Password = User.CreateRandomPassword(), IsActive = true };
            owner.SetNormalizedNames();
            await context.Users.AddAsync(owner);
            await context.SaveChangesAsync();
            await context.Developers.AddAsync(new Developer { UserId = owner.Id, GithubUsername = "owned-github" });
        });
        await Should.ThrowAsync<UserFriendlyException>(() => WithUnitOfWorkAsync(() =>
            Resolve<GitHubOAuthService>().ConnectTenantUserAsync(AbpSession.UserId.Value, 1,
                new GitHubOAuthUserResponse { Login = "owned-github" }, "token")));
    }

    [Fact]
    public async Task Should_Reject_User_And_Tenant_Mismatch()
    {
        await Should.ThrowAsync<UserFriendlyException>(() => WithUnitOfWorkAsync(() =>
            Resolve<GitHubOAuthService>().ConnectTenantUserAsync(AbpSession.UserId.Value, null,
                new GitHubOAuthUserResponse { Login = "github-user" }, "token")));
    }
}
