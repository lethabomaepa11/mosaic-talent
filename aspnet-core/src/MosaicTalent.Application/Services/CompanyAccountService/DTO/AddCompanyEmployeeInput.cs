using MosaicTalent.Domains.Companies;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.CompanyAccountService.DTO;

public class AddCompanyEmployeeInput
{
    [Required]
    [MaxLength(64)]
    public string Name { get; set; }

    [Required]
    [MaxLength(64)]
    public string Surname { get; set; }

    [Required]
    [MaxLength(32)]
    public string UserName { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string EmailAddress { get; set; }

    [Required]
    [MaxLength(128)]
    public string Password { get; set; }

    public CompanyRole Role { get; set; }
}
