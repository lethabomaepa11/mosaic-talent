using MosaicTalent.Services.ProjectWorkspaceService.DTO;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MosaicTalent.Services.ProjectWorkspaceService;

public interface IProjectWorkspaceAppService
{
    Task<List<ProjectWikiPageDto>> GetWikiPages(GetProjectWorkspaceInput input);
    Task<ProjectWikiPageDto> SaveWikiPage(SaveProjectWikiPageInput input);
    Task RemoveWikiPage(RemoveProjectWorkspaceItemInput input);
    Task<List<ProjectResourceDto>> GetResources(GetProjectWorkspaceInput input);
    Task<ProjectResourceDto> AddResource(AddProjectResourceInput input);
    Task RemoveResource(RemoveProjectWorkspaceItemInput input);
}
