using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.CompanyJobService.DTO;

public class UpdateMyJobsPageSettingsInput
{
    [MaxLength(160)]
    public string HeroTitle { get; set; }

    [MaxLength(600)]
    public string HeroSubtitle { get; set; }

    [MaxLength(2048)]
    public string HeroImageUrl { get; set; }

    [MaxLength(32)]
    public string PrimaryColor { get; set; }

    [MaxLength(12000)]
    public string LayoutJson { get; set; }

    [MaxLength(12000)]
    public string ApplicationFormJson { get; set; }
}
