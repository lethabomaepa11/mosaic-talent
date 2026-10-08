using MosaicTalent.Domains.Companies;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.CompanyAccountService.DTO;

public class UpdateCompanyEmployeeRoleInput
{
    [Required]
    public Guid CompanyEmployeeId { get; set; }

    public CompanyRole Role { get; set; }
}
