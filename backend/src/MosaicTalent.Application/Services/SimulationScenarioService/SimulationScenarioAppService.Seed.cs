using Microsoft.EntityFrameworkCore;
using MosaicTalent.Domains.Simulations;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MosaicTalent.Services.SimulationScenarioService;

public partial class SimulationScenarioAppService
{
    private async Task EnsureDefaultScenarios(int tenantId)
    {
        var hasAny = await _scenarioRepository.GetAll().AnyAsync(x => x.TenantId == tenantId);
        if (hasAny)
        {
            return;
        }

        var defaults = new List<(string Title, string Prompt, int BotCount, BotRole[] Roles)>
        {
            (
                "Code Review Conflict",
                "A teammate strongly rejects your pull-request feedback. Resolve disagreement while keeping delivery momentum.",
                2,
                new[] { BotRole.Teammate, BotRole.Facilitator }
            ),
            (
                "Stakeholder Scope Push",
                "A stakeholder adds urgent requirements before release. Negotiate scope, timeline and accountability.",
                3,
                new[] { BotRole.Teammate, BotRole.Stakeholder, BotRole.Facilitator }
            ),
        };

        foreach (var item in defaults)
        {
            var scenario = new SimulationScenario
            {
                TenantId = tenantId,
                Title = item.Title,
                Prompt = item.Prompt,
                BotCount = item.BotCount,
            };
            await _scenarioRepository.InsertAsync(scenario);
            await CurrentUnitOfWork.SaveChangesAsync();

            foreach (var role in item.Roles)
            {
                await _requiredRoleRepository.InsertAsync(new SimulationScenarioRequiredRole
                {
                    TenantId = tenantId,
                    ScenarioId = scenario.Id,
                    Role = role,
                });
            }
        }

        await CurrentUnitOfWork.SaveChangesAsync();
    }
}
