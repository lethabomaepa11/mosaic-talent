using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Ideas;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.IdeatorService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MosaicTalent.Services.IdeatorService;

[AbpAuthorize]
public class IdeatorAppService : MosaicTalentAppServiceBase, IIdeatorAppService
{
    private readonly IRepository<IdeaPost, Guid> _ideas;
    private readonly IRepository<IdeaReaction, Guid> _reactions;
    private readonly IRepository<IdeaComment, Guid> _comments;
    private readonly IRepository<Developer, Guid> _developers;
    private readonly IRepository<User, long> _users;
    private readonly IRepository<Project, Guid> _projects;
    private readonly IRepository<ProjectMember, Guid> _members;
    private readonly IRepository<ProjectTeamInvite, Guid> _invites;

    public IdeatorAppService(
        IRepository<IdeaPost, Guid> ideas,
        IRepository<IdeaReaction, Guid> reactions,
        IRepository<IdeaComment, Guid> comments,
        IRepository<Developer, Guid> developers,
        IRepository<User, long> users,
        IRepository<Project, Guid> projects,
        IRepository<ProjectMember, Guid> members,
        IRepository<ProjectTeamInvite, Guid> invites)
    {
        _ideas = ideas; _reactions = reactions; _comments = comments;
        _developers = developers; _users = users; _projects = projects;
        _members = members; _invites = invites;
    }

    public async Task<List<IdeaPostDto>> GetFeed()
    {
        var developer = await CurrentDeveloper();
        var ideas = await _ideas.GetAll().Where(x => !x.IsArchived && (x.IsPublic || x.CreatorDeveloperId == developer.Id)).OrderByDescending(x => x.CreationTime).ToListAsync();
        return await Map(ideas, developer.Id);
    }

    public async Task<IdeaPostDto> CreateIdea(CreateIdeaPostInput input)
    {
        var developer = await CurrentDeveloper();
        if (input == null || string.IsNullOrWhiteSpace(input.Title) || string.IsNullOrWhiteSpace(input.ProblemStatement) || string.IsNullOrWhiteSpace(input.ProposedSolution))
            throw new UserFriendlyException("Add a title, problem statement, and proposed solution.");
        if (input.Title.Trim().Length > 160 || input.ProblemStatement.Trim().Length > 4000 || input.ProposedSolution.Trim().Length > 4000)
            throw new UserFriendlyException("The title can be up to 160 characters. The problem and solution can each be up to 4000 characters.");
        var idea = new IdeaPost
        {
            TenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required."), CreatorDeveloperId = developer.Id,
            Title = input.Title.Trim(), ProblemStatement = input.ProblemStatement.Trim(), ProposedSolution = input.ProposedSolution.Trim(), IsPublic = input.IsPublic ?? true
        };
        await _ideas.InsertAsync(idea);
        await CurrentUnitOfWork.SaveChangesAsync();
        return (await Map(new List<IdeaPost> { idea }, developer.Id)).Single();
    }

    public async Task<IdeaPostDto> React(ReactToIdeaInput input)
    {
        if (input == null || input.IdeaPostId == Guid.Empty) throw new UserFriendlyException("Choose an idea first.");
        var developer = await CurrentDeveloper();
        var idea = await GetActiveIdea(input.IdeaPostId);
        EnsureIdeaVisible(idea, developer.Id);
        if (!Enum.TryParse<IdeaReactionType>(input.Type, true, out var type) || !Enum.IsDefined(type)) throw new UserFriendlyException("Choose interested, like, or dislike.");
        var reaction = await _reactions.GetAll().FirstOrDefaultAsync(x => x.IdeaPostId == idea.Id && x.DeveloperId == developer.Id);
        if (reaction == null)
            await _reactions.InsertAsync(new IdeaReaction { TenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required."), IdeaPostId = idea.Id, DeveloperId = developer.Id, Type = type });
        else if (reaction.Type == type)
            await _reactions.DeleteAsync(reaction);
        else
            reaction.Type = type;
        await CurrentUnitOfWork.SaveChangesAsync();
        return (await Map(new List<IdeaPost> { idea }, developer.Id)).Single();
    }

    public async Task<IdeaPostDto> Comment(CommentOnIdeaInput input)
    {
        if (input == null || input.IdeaPostId == Guid.Empty) throw new UserFriendlyException("Choose an idea first.");
        var developer = await CurrentDeveloper();
        var idea = await GetActiveIdea(input.IdeaPostId);
        EnsureIdeaVisible(idea, developer.Id);
        if (string.IsNullOrWhiteSpace(input.Body) || input.Body.Trim().Length > 2000) throw new UserFriendlyException("Comments must be between 1 and 2000 characters.");
        await _comments.InsertAsync(new IdeaComment { TenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required."), IdeaPostId = idea.Id, AuthorDeveloperId = developer.Id, Body = input.Body.Trim() });
        await CurrentUnitOfWork.SaveChangesAsync();
        return (await Map(new List<IdeaPost> { idea }, developer.Id)).Single();
    }

    public async Task<IdeaPostDto> ConvertToProject(ConvertIdeaInput input)
    {
        if (input == null || input.IdeaPostId == Guid.Empty) throw new UserFriendlyException("Choose an idea first.");
        var creator = await CurrentDeveloper();
        var idea = await GetActiveIdea(input.IdeaPostId);
        if (idea.CreatorDeveloperId != creator.Id) throw new UserFriendlyException("Only the idea creator can start a project from it.");
        if (idea.ConvertedProjectId.HasValue) throw new UserFriendlyException("This idea has already been converted.");
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var project = new Project
        {
            TenantId = tenantId, OwnerDeveloperId = creator.Id, Title = idea.Title,
            ProblemStatement = idea.ProblemStatement,
            Description = idea.ProposedSolution,
            Status = ProjectStatus.Open, Type = ProjectType.Group, Difficulty = ProjectDifficulty.Intermediate,
            EstimatedHoursPerWeek = 6, MaxMembers = 8, IsPublic = false
        };
        await _projects.InsertAsync(project);
        await CurrentUnitOfWork.SaveChangesAsync();
        await _members.InsertAsync(new ProjectMember { TenantId = tenantId, ProjectId = project.Id, DeveloperId = creator.Id, Role = MemberRole.Lead });
        if (input.InviteInterestedDevelopers)
        {
            var interested = await _reactions.GetAll().Where(x => x.IdeaPostId == idea.Id && x.Type == IdeaReactionType.Interested && x.DeveloperId != creator.Id).Select(x => x.DeveloperId).ToListAsync();
            foreach (var developerId in interested)
                await _invites.InsertAsync(new ProjectTeamInvite { TenantId = tenantId, ProjectId = project.Id, DeveloperId = developerId, InvitedByDeveloperId = creator.Id, Status = ProjectTeamInviteStatus.Pending });
        }
        idea.ConvertedProjectId = project.Id;
        await CurrentUnitOfWork.SaveChangesAsync();
        return (await Map(new List<IdeaPost> { idea }, creator.Id)).Single();
    }

    public async Task DeleteIdea(Guid ideaPostId)
    {
        if (ideaPostId == Guid.Empty) throw new UserFriendlyException("Choose an idea first.");
        var developer = await CurrentDeveloper();
        var idea = await GetActiveIdea(ideaPostId);
        if (idea.CreatorDeveloperId != developer.Id) throw new UserFriendlyException("Only the creator can remove this idea.");
        await _ideas.DeleteAsync(idea);
    }

    private async Task<IdeaPost> GetActiveIdea(Guid id) => await _ideas.GetAll().FirstOrDefaultAsync(x => x.Id == id && !x.IsArchived)
        ?? throw new UserFriendlyException("Idea not found.");

    private static void EnsureIdeaVisible(IdeaPost idea, Guid developerId)
    {
        if (!idea.IsPublic && idea.CreatorDeveloperId != developerId) throw new UserFriendlyException("Idea not found.");
    }

    private async Task<Developer> CurrentDeveloper() => await _developers.GetAll().FirstOrDefaultAsync(x => x.UserId == AbpSession.UserId.Value)
        ?? throw new UserFriendlyException("Complete your developer profile before using Ideator.");

    private async Task<List<IdeaPostDto>> Map(List<IdeaPost> ideas, Guid currentDeveloperId)
    {
        var ids = ideas.Select(x => x.Id).ToList();
        var reactions = await _reactions.GetAll().Where(x => ids.Contains(x.IdeaPostId)).ToListAsync();
        var comments = await _comments.GetAll().Where(x => ids.Contains(x.IdeaPostId)).OrderBy(x => x.CreationTime).ToListAsync();
        var peopleIds = ideas.Select(x => x.CreatorDeveloperId).Concat(reactions.Select(x => x.DeveloperId)).Concat(comments.Select(x => x.AuthorDeveloperId)).Distinct().ToList();
        var developers = await _developers.GetAll().Where(x => peopleIds.Contains(x.Id)).ToListAsync();
        var userIds = developers.Select(x => x.UserId).ToList();
        var users = await _users.GetAll().Where(x => userIds.Contains(x.Id)).ToListAsync();
        string Name(Guid id) { var person = developers.FirstOrDefault(x => x.Id == id); var user = users.FirstOrDefault(x => x.Id == person?.UserId); return user?.FullName ?? "Developer"; }
        return ideas.Select(idea =>
        {
            var ideaReactions = reactions.Where(x => x.IdeaPostId == idea.Id).ToList();
            var ideaComments = comments.Where(x => x.IdeaPostId == idea.Id).ToList();
            return new IdeaPostDto
            {
                Id = idea.Id, CreatorDeveloperId = idea.CreatorDeveloperId, CreatorName = Name(idea.CreatorDeveloperId),
                Title = idea.Title, ProblemStatement = idea.ProblemStatement, ProposedSolution = idea.ProposedSolution,
                CreatedAt = idea.CreationTime, MyReaction = ideaReactions.FirstOrDefault(x => x.DeveloperId == currentDeveloperId)?.Type.ToString(),
                InterestedCount = ideaReactions.Count(x => x.Type == IdeaReactionType.Interested), LikeCount = ideaReactions.Count(x => x.Type == IdeaReactionType.Like),
                DislikeCount = ideaReactions.Count(x => x.Type == IdeaReactionType.Dislike), CommentCount = ideaComments.Count,
                IsOwner = idea.CreatorDeveloperId == currentDeveloperId, IsConverted = idea.ConvertedProjectId.HasValue, ConvertedProjectId = idea.ConvertedProjectId,
                IsPublic = idea.IsPublic,
                Comments = ideaComments.Select(x => new IdeaCommentDto { Id = x.Id, AuthorDeveloperId = x.AuthorDeveloperId, AuthorName = Name(x.AuthorDeveloperId), Body = x.Body, CreatedAt = x.CreationTime }).ToList()
            };
        }).ToList();
    }
}

