namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class DeveloperProjectTaskDto
{
    public string Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string Status { get; set; }
    public string AssignedMemberId { get; set; }
    public string AssignedMemberName { get; set; }
}
