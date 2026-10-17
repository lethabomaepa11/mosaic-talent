using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.ProjectProgressService.DTO;

public class CreateProjectProgressEntryInput
{
    public Guid ProjectId { get; set; }

    [Required, StringLength(160, MinimumLength = 3)]
    public string Title { get; set; }

    [Required, StringLength(3000, MinimumLength = 10)]
    public string Summary { get; set; }

    [Required, Url, StringLength(2048)]
    public string EvidenceUrl { get; set; }

    [Required, StringLength(2000, MinimumLength = 10)]
    public string SelfReview { get; set; }
}
