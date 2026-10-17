using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Domains.Developers;

public class Developer : FullAuditedEntity<Guid>
{
    public long UserId { get; set; }

    [MaxLength(64)]
    public string GithubUsername { get; set; }

    [MaxLength(4096)]
    public string GithubAccessTokenEncrypted { get; set; }

    public DateTime? GithubAccessTokenUpdatedAt { get; set; }

    [Range(0, 80)]
    public int? YearsOfExperience { get; set; }

    [Range(0, 9)]
    public int? YearOfStudy { get; set; }

    public StudyLevel StudyLevel { get; set; }
}
