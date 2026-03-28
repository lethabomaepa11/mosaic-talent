using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Companies;

public class CompanyJobsPageSettings : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid CompanyId { get; set; }

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

    [MaxLength(16000)]
    public string EmailTemplateSettingsJson { get; set; }
}
