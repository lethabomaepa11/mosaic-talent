using MosaicTalent.Domains.Companies;
using System;

namespace MosaicTalent.Services.CompanyAccountService.DTO;

public class CompanyEmployeeDto
{
    public Guid Id { get; set; }

    public Guid CompanyId { get; set; }

    public long UserId { get; set; }

    public string Name { get; set; }

    public string Surname { get; set; }

    public string EmailAddress { get; set; }

    public string UserName { get; set; }

    public CompanyRole Role { get; set; }
}
