using Abp.Application.Services;
using MosaicTalent.Services.CompanyAccountService.DTO;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MosaicTalent.Services.CompanyAccountService;

public interface ICompanyAccountAppService : IApplicationService
{
    Task<CreateCompanyAccountOutput> CreateCompanyAccount(CreateCompanyAccountInput input);

    Task<CompanyPublicBrandingDto> GetCompanyBrandingByTenancyName(string tenancyName);

    Task<CompanyDto> GetMyCompany();

    Task<List<CompanyEmployeeDto>> GetMyCompanyEmployees();

    Task<CompanyEmployeeDto> AddCompanyEmployee(AddCompanyEmployeeInput input);

    Task<CompanyEmployeeDto> UpdateEmployeeRole(UpdateCompanyEmployeeRoleInput input);

    Task<CompanyEmployeeProfileDto> GetMyEmployeeProfile();

    Task<CompanyEmployeeProfileDto> UpdateMyEmployeeProfile(UpdateCompanyEmployeeProfileInput input);
}
