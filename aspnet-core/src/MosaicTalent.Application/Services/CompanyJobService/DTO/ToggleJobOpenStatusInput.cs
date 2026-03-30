using System;

namespace MosaicTalent.Services.CompanyJobService.DTO;

public class ToggleJobOpenStatusInput
{
    public Guid JobId { get; set; }

    public bool IsOpen { get; set; }
}
