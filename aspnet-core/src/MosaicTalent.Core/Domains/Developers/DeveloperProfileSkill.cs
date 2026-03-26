using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Developers;

public class DeveloperProfileSkill : FullAuditedEntity<Guid>
{
    public Guid ProfileId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; }
}
