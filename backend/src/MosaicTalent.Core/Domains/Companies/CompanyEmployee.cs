using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;

namespace MosaicTalent.Domains.Companies;

public class CompanyEmployee : FullAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }

    public Guid CompanyId { get; set; }

    public long UserId { get; set; }

    public CompanyRole Role { get; set; }
}
