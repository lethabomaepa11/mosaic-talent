using System;

namespace MosaicTalent.Services.CompanyJobService.DTO;

public class JobCandidateDto
{
    public Guid DeveloperId { get; set; }

    public long UserId { get; set; }

    public string FullName { get; set; }

    public string Email { get; set; }

    public string AvatarUrl { get; set; }

    public string GithubUsername { get; set; }
}
