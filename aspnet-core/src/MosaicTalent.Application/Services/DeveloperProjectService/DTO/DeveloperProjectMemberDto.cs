using System;

namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class DeveloperProjectMemberDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string UserName { get; set; }
    public string Avatar { get; set; }
    public string Role { get; set; }

    public bool IsMentor { get; set; }
}
