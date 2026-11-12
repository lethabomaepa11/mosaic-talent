using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.BuildJourneyService.DTO;

public class InviteBuildMemberInput
{
    [Required] public Guid ProjectId { get; set; }
    [Required, MaxLength(256)] public string UserName { get; set; }
}

public class BuildInvitationDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectTitle { get; set; }
    public int EstimatedHoursPerWeek { get; set; }
}
