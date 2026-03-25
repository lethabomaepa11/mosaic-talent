using Abp.Application.Services;
using MosaicTalent.Authorization.Accounts.Dto;
using System.Threading.Tasks;

namespace MosaicTalent.Authorization.Accounts;

public interface IAccountAppService : IApplicationService
{
    Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input);

    Task<RegisterOutput> Register(RegisterInput input);
}
