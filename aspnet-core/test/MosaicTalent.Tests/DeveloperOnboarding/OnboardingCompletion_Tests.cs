using Abp.UI;
using Castle.MicroKernel.Registration;
using Microsoft.Extensions.Configuration;
using MosaicTalent.Services.DeveloperOnboardingService;
using MosaicTalent.Services.DeveloperOnboardingService.DTO;
using NSubstitute;
using Shouldly;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace MosaicTalent.Tests.DeveloperOnboarding;

public class OnboardingCompletion_Tests : MosaicTalentTestBase
{
    public OnboardingCompletion_Tests()
    {
        LocalIocManager.IocContainer.Register(
            Component.For<IConfiguration>().Instance(new ConfigurationBuilder().AddInMemoryCollection().Build()),
            Component.For<System.Net.Http.IHttpClientFactory>().Instance(Substitute.For<System.Net.Http.IHttpClientFactory>()));
    }

    [Fact]
    public async Task Should_Save_Draft_Then_Complete_Without_Github()
    {
        var service = Resolve<IDeveloperOnboardingAppService>();
        var draft = await service.UpsertMyProfile(new UpsertDeveloperOnboardingInput { OnboardingStep = 2 });
        draft.GithubUsername.ShouldBeNullOrEmpty();
        draft.HasCompletedOnboarding.ShouldBeFalse();
        draft.OnboardingStep.ShouldBe(2);
        draft.UserId.ShouldBe(AbpSession.UserId.Value);
        draft.FullName.ShouldNotBeNullOrEmpty();

        var result = await service.UpsertMyProfile(new UpsertDeveloperOnboardingInput
        {
            CompleteOnboarding = true, Skills = new List<string> { " Python ", "python" },
        });
        result.HasCompletedOnboarding.ShouldBeTrue();
        result.Skills.Count.ShouldBe(1);
        var reloaded = await service.GetMyProfile();
        reloaded.HasCompletedOnboarding.ShouldBeTrue();
        reloaded.OnboardingStep.ShouldBe(3);
    }

    [Fact]
    public async Task Should_Not_Complete_Without_A_Skill()
    {
        var service = Resolve<IDeveloperOnboardingAppService>();
        await Should.ThrowAsync<UserFriendlyException>(() => service.UpsertMyProfile(new UpsertDeveloperOnboardingInput
        {
            CompleteOnboarding = true, Skills = new List<string> { " " },
        }));
        (await service.GetMyProfile()).HasCompletedOnboarding.ShouldBeFalse();
    }

    [Fact]
    public async Task Manual_Github_Input_Must_Not_Create_An_Identity_Link()
    {
        var result = await Resolve<IDeveloperOnboardingAppService>().UpsertMyProfile(new UpsertDeveloperOnboardingInput
        {
            GithubUsername = "someone-else", CompleteOnboarding = true, Skills = new List<string> { "Python" },
        });
        result.GithubUsername.ShouldBeNullOrEmpty();
    }

    [Fact]
    public async Task Editing_A_Completed_Profile_Must_Not_Reset_Completion()
    {
        var service = Resolve<IDeveloperOnboardingAppService>();
        await service.UpsertMyProfile(new UpsertDeveloperOnboardingInput { CompleteOnboarding = true, Skills = new List<string> { "Python" } });
        var edited = await service.UpsertMyProfile(new UpsertDeveloperOnboardingInput { Skills = new List<string> { "C#" } });
        edited.HasCompletedOnboarding.ShouldBeTrue();
        await Should.ThrowAsync<UserFriendlyException>(() => service.UpsertMyProfile(new UpsertDeveloperOnboardingInput()));
    }
}
