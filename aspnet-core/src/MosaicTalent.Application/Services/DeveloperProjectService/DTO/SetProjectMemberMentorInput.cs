using System;

namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class SetProjectMemberMentorInput
{
    public Guid ProjectId { get; set; }
    public Guid MemberId { get; set; }
    public bool IsMentor { get; set; }
}
