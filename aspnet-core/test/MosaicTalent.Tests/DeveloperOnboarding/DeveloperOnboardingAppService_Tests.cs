using Castle.MicroKernel.Registration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Services.DeveloperOnboardingService;
using MosaicTalent.Services.DeveloperOnboardingService.DTO;
using NSubstitute;
using Shouldly;
using System;
using System.Threading.Tasks;
using Xunit;

namespace MosaicTalent.Tests.DeveloperOnboarding;

public class DeveloperOnboardingAppService_Tests : MosaicTalentTestBase
{
    public DeveloperOnboardingAppService_Tests()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection().Build();
        var httpClientFactory = Substitute.For<System.Net.Http.IHttpClientFactory>();

        LocalIocManager.IocContainer.Register(
            Component.For<IConfiguration>().Instance(config).LifestyleSingleton(),
            Component.For<System.Net.Http.IHttpClientFactory>().Instance(httpClientFactory).LifestyleSingleton());
    }

    [Fact]
    public async Task UpsertMyProfile_Should_Ignore_UserProvided_TeamworkRating()
    {
        var appService = Resolve<IDeveloperOnboardingAppService>();
        var user = await GetCurrentUserAsync();
        Guid developerId = Guid.Empty;

        await UsingDbContextAsync(1, async context =>
        {
            var developer = await context.Developers.FirstOrDefaultAsync(x => x.UserId == user.Id);
            if (developer == null)
            {
                developer = new Developer
                {
                    UserId = user.Id,
                    GithubUsername = "teamwork-test-user",
                    StudyLevel = StudyLevel.Undergrad,
                };
                await context.Developers.AddAsync(developer);
                await context.SaveChangesAsync();
            }

            developerId = developer.Id;

            var profile = await context.DeveloperProfiles
                .FirstOrDefaultAsync(x => x.DeveloperId == developer.Id);
            if (profile == null)
            {
                await context.DeveloperProfiles.AddAsync(new DeveloperProfile
                {
                    DeveloperId = developer.Id,
                    TeamworkRating = 4,
                });
            }
            else
            {
                profile.TeamworkRating = 4;
            }
        });

        var result = await appService.UpsertMyProfile(new UpsertDeveloperOnboardingInput
        {
            GithubUsername = "teamwork-test-user",
            AvatarUrl = string.Empty,
            YearsOfExperience = 2,
            YearOfStudy = 2,
            StudyLevel = StudyLevel.Undergrad,
            Bio = "Testing teamwork rating protection.",
            Location = "Johannesburg",
            TeamworkRating = 10,
        });

        result.TeamworkRating.ShouldNotBe(10);
        result.TeamworkRating.ShouldBe(0);

        await UsingDbContextAsync(1, async context =>
        {
            var profile = await context.DeveloperProfiles
                .FirstOrDefaultAsync(x => x.DeveloperId == developerId);
            profile.ShouldNotBeNull();
            profile.TeamworkRating.ShouldBe(0);
        });
    }
}
