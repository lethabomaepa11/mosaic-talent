using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.CompanyAccountService.DTO;

public class CreateCompanyAccountInput
{
    [Required]
    [MaxLength(128)]
    public string Name { get; set; }

    [MaxLength(256)]
    public string LogoStoredFileId { get; set; }

    [MaxLength(256)]
    public string Website { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; }

    [Required]
    [MaxLength(64)]
    public string AccountOwnerName { get; set; }

    [Required]
    [MaxLength(64)]
    public string AccountOwnerSurname { get; set; }

    [Required]
    [MaxLength(32)]
    public string AccountOwnerUserName { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string AccountOwnerEmailAddress { get; set; }

    [Required]
    [MaxLength(128)]
    public string AccountOwnerPassword { get; set; }
}
