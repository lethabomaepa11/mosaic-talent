using Abp.UI;
using MosaicTalent.Services.SimulationScenarioService;
using MosaicTalent.Services.SimulationScenarioService.DTO;
using Shouldly;
using System.Threading.Tasks;
using Xunit;

namespace MosaicTalent.Tests.Simulations;

public class SimulationRetirement_Tests
{
    [Fact]
    public async Task Cannot_Create_New_Scenario()
    {
        var service = CreateService();
        var error = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.CreateScenario(new CreateSimulationScenarioInput()));
        error.Message.ShouldContain("retired");
    }

    [Fact]
    public async Task Cannot_Start_New_Session()
    {
        var service = CreateService();
        var error = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.StartSession(new StartSimulationSessionInput()));
        error.Message.ShouldContain("retired");
    }

    private static SimulationScenarioAppService CreateService() =>
        new(null, null, null, null, null, null, null, null, null, null, null, null);
}
