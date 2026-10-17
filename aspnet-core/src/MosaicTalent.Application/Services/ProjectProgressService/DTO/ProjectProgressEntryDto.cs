using System;
using System.Collections.Generic;

namespace MosaicTalent.Services.ProjectProgressService.DTO;

public class ProjectProgressEntryDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid DeveloperId { get; set; }
    public string AuthorName { get; set; }
    public string Title { get; set; }
    public string Summary { get; set; }
    public string EvidenceUrl { get; set; }
    public string SelfReview { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ProjectProgressReviewDto> Reviews { get; set; } = new();
}
