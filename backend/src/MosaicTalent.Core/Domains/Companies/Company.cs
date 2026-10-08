using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Companies;

public class Company : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    [Required]
    [MaxLength(128)]
    public string Name { get; set; }

    [Required]
    [MaxLength(64)]
    public string TenancyName { get; set; }

    [MaxLength(256)]
    public string LogoStoredFileId { get; set; }

    [MaxLength(256)]
    public string Website { get; set; }

    [Required]
    [MaxLength(256)]
    public string Email { get; set; }

    public long AccountOwnerUserId { get; set; }
}
