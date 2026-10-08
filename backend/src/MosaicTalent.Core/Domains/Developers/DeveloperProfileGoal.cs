using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Developers;

public class DeveloperProfileGoal : FullAuditedEntity<Guid>
{
    public Guid ProfileId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Goal { get; set; }
}
