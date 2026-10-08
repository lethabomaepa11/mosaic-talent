using Castle.MicroKernel.Registration;
using MosaicTalent.Authentication.External;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Models.TokenAuth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NSubstitute;
using Shouldly;
using System.Threading.Tasks;
using Xunit;

namespace MosaicTalent.Tests.Authentication;

public class GitHubOAuthService_Tests : MosaicTalentTestBase
{
    public GitHubOAuthService_Tests()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection().Build();
        var httpClientFactory = Substitute.For<System.Net.Http.IHttpClientFactory>();

        LocalIocManager.IocContainer.Register(
            Component.For<IConfiguration>().Instance(config).LifestyleSingleton(),
            Component.For<System.Net.Http.IHttpClientFactory>().Instance(httpClientFactory).LifestyleSingleton());
    }

    private async Task<User> RunFindOrCreateAsync(int? tenantId, GitHubOAuthUserResponse gitHubUser, string email)
    {
        User result = null;

        using (UsingTenantId(tenantId))
        {
            await WithUnitOfWorkAsync(async () =>
            {
                var service = Resolve<GitHubOAuthService>();
                result = await service.FindOrCreateTenantUserAsync(gitHubUser, email, null);
            });
        }

        return result;
    }

    [Fact]
    public async Task Should_Create_User_In_Tenant_1_When_TenantId_Is_Missing_And_Create_Developer_Profile()
    {
        var gitHubUser = new GitHubOAuthUserResponse
        {
            Login = "oauth-new-dev",
            Name = "OAuth Dev",
            Email = "oauth-new-dev@example.com",
            AvatarUrl = "https://avatars.githubusercontent.com/u/1001?v=4"
        };

        var createdUser = await RunFindOrCreateAsync(null, gitHubUser, gitHubUser.Email);

        createdUser.ShouldNotBeNull();
        createdUser.TenantId.ShouldBe(1);
        createdUser.EmailAddress.ShouldBe(gitHubUser.Email);

        await UsingDbContextAsync(1, async context =>
        {
            var savedUser = await context.Users.FirstOrDefaultAsync(x => x.Id == createdUser.Id);
            savedUser.ShouldNotBeNull();
            savedUser.TenantId.ShouldBe(1);
            savedUser.AvatarUrl.ShouldBe("https://avatars.githubusercontent.com/u/1001?v=4");

            var developer = await context.Developers.FirstOrDefaultAsync(d => d.UserId == createdUser.Id);
            developer.ShouldNotBeNull();
            developer.GithubUsername.ShouldBe("oauth-new-dev");
        });
    }

    [Fact]
    public async Task Should_Update_Existing_User_Developer_Github_Data_In_Tenant_1_When_TenantId_Is_Missing()
    {
        User existingUser = null;
        await UsingDbContextAsync(1, async context =>
        {
            existingUser = new User
            {
                TenantId = 1,
                Name = "Existing",
                Surname = "Developer",
                UserName = "oauth-existing-dev",
                EmailAddress = "oauth-existing-dev@example.com",
                Password = User.CreateRandomPassword(),
                IsActive = true,
                IsEmailConfirmed = true
            };
            existingUser.SetNormalizedNames();
            await context.Users.AddAsync(existingUser);
            await context.SaveChangesAsync();

            await context.Developers.AddAsync(new Developer
            {
                UserId = existingUser.Id,
                GithubUsername = "old-username"
            });
        });

        var gitHubUser = new GitHubOAuthUserResponse
        {
            Login = "new-username",
            Name = "Existing Developer",
            Email = "oauth-existing-dev@example.com",
            AvatarUrl = "https://avatars.githubusercontent.com/u/2002?v=4"
        };

        var resolvedUser = await RunFindOrCreateAsync(null, gitHubUser, gitHubUser.Email);

        resolvedUser.ShouldNotBeNull();
        resolvedUser.Id.ShouldBe(existingUser.Id);
        resolvedUser.TenantId.ShouldBe(1);

        await UsingDbContextAsync(1, async context =>
        {
            var developer = await context.Developers.FirstOrDefaultAsync(d => d.UserId == existingUser.Id);
            var user = await context.Users.FirstOrDefaultAsync(x => x.Id == existingUser.Id);
            developer.ShouldNotBeNull();
            user.ShouldNotBeNull();
            developer.GithubUsername.ShouldBe("new-username");
            user.AvatarUrl.ShouldBe("https://avatars.githubusercontent.com/u/2002?v=4");
        });
    }

    [Fact]
    public async Task Should_Not_Create_Duplicate_User_For_Same_Github_Login_When_Email_Changes()
    {
        User existingUser = null;
        await UsingDbContextAsync(1, async context =>
        {
            existingUser = new User
            {
                TenantId = 1,
                Name = "Github",
                Surname = "Duplicate",
                UserName = "github-dup-user",
                EmailAddress = "github-dup-old@example.com",
                Password = User.CreateRandomPassword(),
                IsActive = true,
                IsEmailConfirmed = true
            };
            existingUser.SetNormalizedNames();
            await context.Users.AddAsync(existingUser);
            await context.SaveChangesAsync();

            await context.Developers.AddAsync(new Developer
            {
                UserId = existingUser.Id,
                GithubUsername = "same-github-login"
            });
        });

        var gitHubUser = new GitHubOAuthUserResponse
        {
            Login = "same-github-login",
            Name = "Github Duplicate",
            Email = "github-dup-new@example.com",
            AvatarUrl = "https://avatars.githubusercontent.com/u/9009?v=4"
        };

        var resolvedUser = await RunFindOrCreateAsync(null, gitHubUser, gitHubUser.Email);

        resolvedUser.ShouldNotBeNull();
        resolvedUser.Id.ShouldBe(existingUser.Id);

        await UsingDbContextAsync(1, async context =>
        {
            var usersByGithub = await context.Developers.CountAsync(d => d.GithubUsername == "same-github-login");
            usersByGithub.ShouldBe(1);
        });
    }
}
