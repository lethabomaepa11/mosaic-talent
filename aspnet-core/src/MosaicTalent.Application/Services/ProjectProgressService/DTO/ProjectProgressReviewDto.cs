using System;

namespace MosaicTalent.Services.ProjectProgressService.DTO;

public class ProjectProgressReviewDto
{
    public Guid Id { get; set; }
    public Guid ReviewerDeveloperId { get; set; }
    public string ReviewerName { get; set; }
    public string ReviewerRole { get; set; }
    public string Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}
