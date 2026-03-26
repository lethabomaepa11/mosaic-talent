using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Developers;

public class DeveloperProfile : FullAuditedEntity<Guid>
{
    public Guid DeveloperId { get; set; }

    [MaxLength(2000)]
    public string Bio { get; set; }

    [MaxLength(256)]
    public string Location { get; set; }

    [Range(0, 10)]
    public double TeamworkRating { get; set; }
}
