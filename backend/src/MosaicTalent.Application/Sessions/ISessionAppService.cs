using Abp.Application.Services;
using MosaicTalent.Sessions.Dto;
using System.Threading.Tasks;

namespace MosaicTalent.Sessions;

public interface ISessionAppService : IApplicationService
{
    Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformations();
}
