namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class GithubRepositoryDto
{
    public string Name { get; set; }
    public string FullName { get; set; }
    public string HtmlUrl { get; set; }
    public bool IsPrivate { get; set; }
    public string DefaultBranch { get; set; }
}
