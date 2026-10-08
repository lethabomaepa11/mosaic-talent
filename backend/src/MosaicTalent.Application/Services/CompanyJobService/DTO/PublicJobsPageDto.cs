using System;

namespace MosaicTalent.Services.CompanyJobService.DTO;

public class PublicJobsPageDto
{
    public Guid CompanyId { get; set; }

    public string CompanyName { get; set; }

    public string TenancyName { get; set; }

    public string CompanyLogoStoredFileId { get; set; }

    public string CompanyEmail { get; set; }

    public string CompanyWebsiteUrl { get; set; }

    public string HeroTitle { get; set; }

    public string HeroSubtitle { get; set; }

    public string HeroImageUrl { get; set; }

    public string PrimaryColor { get; set; }

    public string LayoutJson { get; set; }

    public string ApplicationFormJson { get; set; }

    public string EmailTemplateSettingsJson { get; set; }
}
