namespace MosaicTalent.Services.CompanyAccountService.DTO;

public class CompanyPublicBrandingDto
{
    public string Name { get; set; }

    public string TenancyName { get; set; }

    public string LogoStoredFileId { get; set; }
    public string WebsiteUrl { get; set; } = "";
}
