using Abp.Application.Services;
using MosaicTalent.MultiTenancy.Dto;

namespace MosaicTalent.MultiTenancy;

public interface ITenantAppService : IAsyncCrudAppService<TenantDto, int, PagedTenantResultRequestDto, CreateTenantDto, TenantDto>
{
}

