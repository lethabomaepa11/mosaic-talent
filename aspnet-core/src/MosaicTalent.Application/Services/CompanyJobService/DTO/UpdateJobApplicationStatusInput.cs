using System;

namespace MosaicTalent.Services.CompanyJobService.DTO;

public class UpdateJobApplicationStatusInput
{
    public Guid JobApplicationId { get; set; }

    public int Status { get; set; }
}
