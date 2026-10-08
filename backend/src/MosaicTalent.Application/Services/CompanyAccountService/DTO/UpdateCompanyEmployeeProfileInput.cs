using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.CompanyAccountService.DTO;

public class UpdateCompanyEmployeeProfileInput
{
    [MaxLength(64)]
    public string Name { get; set; }

    [MaxLength(64)]
    public string Surname { get; set; }

    [MaxLength(512)]
    public string AvatarUrl { get; set; }
}
