using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.ProjectWorkspaceService.DTO;

public class GetProjectWorkspaceInput { public Guid ProjectId { get; set; } }

public class ProjectWikiPageDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid CreatedByDeveloperId { get; set; }
    public string Title { get; set; }
    public string ContentMarkdown { get; set; }
    public DateTime CreationTime { get; set; }
    public DateTime? LastModificationTime { get; set; }
}

public class SaveProjectWikiPageInput
{
    public Guid ProjectId { get; set; }
    public Guid? Id { get; set; }
    [Required, MaxLength(160)] public string Title { get; set; }
    [MaxLength(20000)] public string ContentMarkdown { get; set; }
}

public class ProjectResourceDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid AddedByDeveloperId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public string Url { get; set; }
    public DateTime CreationTime { get; set; }
}

public class AddProjectResourceInput
{
    public Guid ProjectId { get; set; }
    [Required, MaxLength(160)] public string Name { get; set; }
    [MaxLength(1200)] public string Description { get; set; }
    [Required, MaxLength(2048), Url] public string Url { get; set; }
}

public class RemoveProjectWorkspaceItemInput { public Guid ProjectId { get; set; } public Guid Id { get; set; } }
