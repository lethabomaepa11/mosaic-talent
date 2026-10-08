using System;
using System.Collections.Generic;

namespace MosaicTalent.Services.CompanyJobService.DTO;

public class BulkMoveApplicationsToAssessmentInput
{
    public Guid JobId { get; set; }

    public double? MinimumMatchScore { get; set; }

    public List<int> CurrentStatuses { get; set; } = new();

    public bool IncludeMemberApplications { get; set; } = true;

    public bool IncludePublicApplications { get; set; } = true;
}
