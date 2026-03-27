using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.CompanyJobService.DTO;

public class ApplyToJobInput
{
    public Guid JobId { get; set; }

    [MaxLength(2048)]
    public string ResumeStoredFileId { get; set; }

    public int Source { get; set; }
}
