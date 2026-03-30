using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.CompanyAccountService.DTO;

public class UpdateMyCompanyInput
{
    [Required]
    [MaxLength(160)]
    public string Name { get; set; }

    [MaxLength(2048)]
    public string LogoStoredFileId { get; set; }

    [MaxLength(2048)]
    public string Website { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; }
}
