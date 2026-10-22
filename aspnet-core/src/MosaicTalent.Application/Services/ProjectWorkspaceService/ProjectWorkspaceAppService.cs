using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.ProjectWorkspaceService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MosaicTalent.Services.ProjectWorkspaceService;

[AbpAuthorize]
public class ProjectWorkspaceAppService : MosaicTalentAppServiceBase, IProjectWorkspaceAppService
{
    private readonly IRepository<Developer, Guid> _developers;
    private readonly IRepository<ProjectMember, Guid> _members;
    private readonly IRepository<ProjectWikiPage, Guid> _wikiPages;
    private readonly IRepository<ProjectResource, Guid> _resources;

    public ProjectWorkspaceAppService(
        IRepository<Developer, Guid> developers,
        IRepository<ProjectMember, Guid> members,
        IRepository<ProjectWikiPage, Guid> wikiPages,
        IRepository<ProjectResource, Guid> resources)
    {
        _developers = developers;
        _members = members;
        _wikiPages = wikiPages;
        _resources = resources;
    }

    public async Task<List<ProjectWikiPageDto>> GetWikiPages(GetProjectWorkspaceInput input)
    {
        await GetMember(input?.ProjectId ?? Guid.Empty);
        return await _wikiPages.GetAll().Where(x => x.ProjectId == input.ProjectId)
            .OrderBy(x => x.Title).Select(x => new ProjectWikiPageDto
            {
                Id = x.Id, ProjectId = x.ProjectId, CreatedByDeveloperId = x.CreatedByDeveloperId,
                Title = x.Title, ContentMarkdown = x.ContentMarkdown, CreationTime = x.CreationTime,
                LastModificationTime = x.LastModificationTime,
            }).ToListAsync();
    }

    public async Task<ProjectWikiPageDto> SaveWikiPage(SaveProjectWikiPageInput input)
    {
        if (input == null || input.ProjectId == Guid.Empty || string.IsNullOrWhiteSpace(input.Title))
            throw new UserFriendlyException("Add a title and choose a project for this wiki page.");
        var developer = await GetMember(input.ProjectId);
        if (input.Title.Trim().Length > 160 || (input.ContentMarkdown?.Length ?? 0) > 20000)
            throw new UserFriendlyException("Wiki titles can be up to 160 characters and content up to 20000 characters.");

        ProjectWikiPage page;
        if (input.Id.HasValue)
        {
            page = await _wikiPages.GetAll().FirstOrDefaultAsync(x => x.Id == input.Id.Value && x.ProjectId == input.ProjectId)
                ?? throw new UserFriendlyException("Wiki page not found.");
            page.Title = input.Title.Trim();
            page.ContentMarkdown = input.ContentMarkdown?.Trim() ?? string.Empty;
            page.UpdatedByDeveloperId = developer.Id;
        }
        else
        {
            page = new ProjectWikiPage
            {
                TenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required."),
                ProjectId = input.ProjectId, CreatedByDeveloperId = developer.Id, UpdatedByDeveloperId = developer.Id,
                Title = input.Title.Trim(), ContentMarkdown = input.ContentMarkdown?.Trim() ?? string.Empty,
            };
            await _wikiPages.InsertAsync(page);
        }
        await CurrentUnitOfWork.SaveChangesAsync();
        return new ProjectWikiPageDto
        {
            Id = page.Id, ProjectId = page.ProjectId, CreatedByDeveloperId = page.CreatedByDeveloperId,
            Title = page.Title, ContentMarkdown = page.ContentMarkdown, CreationTime = page.CreationTime,
            LastModificationTime = page.LastModificationTime,
        };
    }

    public async Task RemoveWikiPage(RemoveProjectWorkspaceItemInput input)
    {
        await GetMember(input?.ProjectId ?? Guid.Empty);
        var page = await _wikiPages.GetAll().FirstOrDefaultAsync(x => x.Id == input.Id && x.ProjectId == input.ProjectId)
            ?? throw new UserFriendlyException("Wiki page not found.");
        await _wikiPages.DeleteAsync(page);
    }

    public async Task<List<ProjectResourceDto>> GetResources(GetProjectWorkspaceInput input)
    {
        await GetMember(input?.ProjectId ?? Guid.Empty);
        return await _resources.GetAll().Where(x => x.ProjectId == input.ProjectId).OrderBy(x => x.Name)
            .Select(x => new ProjectResourceDto
            {
                Id = x.Id, ProjectId = x.ProjectId, AddedByDeveloperId = x.AddedByDeveloperId,
                Name = x.Name, Description = x.Description, Url = x.Url, CreationTime = x.CreationTime,
            }).ToListAsync();
    }

    public async Task<ProjectResourceDto> AddResource(AddProjectResourceInput input)
    {
        if (input == null || input.ProjectId == Guid.Empty || string.IsNullOrWhiteSpace(input.Name) || string.IsNullOrWhiteSpace(input.Url))
            throw new UserFriendlyException("Add a name and web address for this resource.");
        var developer = await GetMember(input.ProjectId);
        if (input.Name.Trim().Length > 160 || (input.Description?.Length ?? 0) > 1200 || input.Url.Trim().Length > 2048)
            throw new UserFriendlyException("Resource details are too long.");
        if (!Uri.TryCreate(input.Url.Trim(), UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp))
            throw new UserFriendlyException("Use a valid http or https web address.");
        var resource = new ProjectResource
        {
            TenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required."),
            ProjectId = input.ProjectId, AddedByDeveloperId = developer.Id, Name = input.Name.Trim(),
            Description = input.Description?.Trim(), Url = uri.ToString(),
        };
        await _resources.InsertAsync(resource);
        await CurrentUnitOfWork.SaveChangesAsync();
        return new ProjectResourceDto
        {
            Id = resource.Id, ProjectId = resource.ProjectId, AddedByDeveloperId = resource.AddedByDeveloperId,
            Name = resource.Name, Description = resource.Description, Url = resource.Url, CreationTime = resource.CreationTime,
        };
    }

    public async Task RemoveResource(RemoveProjectWorkspaceItemInput input)
    {
        await GetMember(input?.ProjectId ?? Guid.Empty);
        var resource = await _resources.GetAll().FirstOrDefaultAsync(x => x.Id == input.Id && x.ProjectId == input.ProjectId)
            ?? throw new UserFriendlyException("Project resource not found.");
        await _resources.DeleteAsync(resource);
    }

    private async Task<Developer> GetMember(Guid projectId)
    {
        if (projectId == Guid.Empty) throw new UserFriendlyException("Project is required.");
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("Sign in to open this project workspace.");
        var developer = await _developers.GetAll().FirstOrDefaultAsync(x => x.UserId == userId)
            ?? throw new UserFriendlyException("Complete your developer profile to open this project workspace.");
        var isMember = await _members.GetAll().AnyAsync(x => x.ProjectId == projectId && x.DeveloperId == developer.Id);
        if (!isMember) throw new UserFriendlyException("Only project members can view or edit its workspace.");
        return developer;
    }
}
