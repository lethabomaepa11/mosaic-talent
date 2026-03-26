using System;

namespace MosaicTalent.Services.CompanyAccountService.DTO;

public class CreateCompanyAccountOutput
{
    public Guid CompanyId { get; set; }

    public int TenantId { get; set; }

    public string TenancyName { get; set; }
}
