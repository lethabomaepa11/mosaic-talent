using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;

namespace MosaicTalent.Domains.Ideas;

public enum IdeaReactionType
{
    Interested = 1,
    Like = 2,
    Dislike = 3,
}

public class IdeaReaction : CreationAuditedEntity<Guid>, IMustHaveTenant
{
    public int TenantId { get; set; }
    public Guid IdeaPostId { get; set; }
    public Guid DeveloperId { get; set; }
    public IdeaReactionType Type { get; set; }
}
