using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.ProjectProgressService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MosaicTalent.Services.ProjectProgressService;

[AbpAuthorize]
public class ProjectProgressAppService : MosaicTalentAppServiceBase, IProjectProgressAppService
{
    private readonly IRepository<Developer, Guid> _developerRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly IRepository<Project, Guid> _projectRepository;
    private readonly IRepository<ProjectMember, Guid> _projectMemberRepository;
    private readonly IRepository<ProjectProgressEntry, Guid> _entryRepository;
    private readonly IRepository<ProjectProgressReview, Guid> _reviewRepository;

    public ProjectProgressAppService(
        IRepository<Developer, Guid> developerRepository,
        IRepository<User, long> userRepository,
        IRepository<Project, Guid> projectRepository,
        IRepository<ProjectMember, Guid> projectMemberRepository,
        IRepository<ProjectProgressEntry, Guid> entryRepository,
        IRepository<ProjectProgressReview, Guid> reviewRepository)
    {
        _developerRepository = developerRepository;
        _userRepository = userRepository;
        _projectRepository = projectRepository;
        _projectMemberRepository = projectMemberRepository;
        _entryRepository = entryRepository;
        _reviewRepository = reviewRepository;
    }

    public async Task<List<ProjectProgressEntryDto>> GetProjectProgressEntries(Guid projectId)
    {
        var developer = await GetCurrentDeveloper();
        await EnsureProjectMember(projectId, developer.Id);
        var entries = await _entryRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .OrderByDescending(x => x.CreationTime)
            .ToListAsync();
        return await MapEntries(projectId, entries);
    }

    public async Task<ProjectProgressEntryDto> CreateProjectProgressEntry(CreateProjectProgressEntryInput input)
    {
        if (input == null || input.ProjectId == Guid.Empty)
        {
            throw new UserFriendlyException("Project is required.");
        }

        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        if (project.Status != ProjectStatus.Open && project.Status != ProjectStatus.InProgress)
        {
            throw new UserFriendlyException("Progress entries can be added while the project is open or in progress.");
        }

        var title = input.Title?.Trim() ?? string.Empty;
        var summary = input.Summary?.Trim() ?? string.Empty;
        var evidenceUrl = input.EvidenceUrl?.Trim() ?? string.Empty;
        var selfReview = input.SelfReview?.Trim() ?? string.Empty;
        if (title.Length < 3 || summary.Length < 10 || selfReview.Length < 10)
        {
            throw new UserFriendlyException("Add a title, work summary, and self-review before saving.");
        }
        if (!Uri.TryCreate(evidenceUrl, UriKind.Absolute, out var parsedUrl) ||
            (parsedUrl.Scheme != Uri.UriSchemeHttp && parsedUrl.Scheme != Uri.UriSchemeHttps))
        {
            throw new UserFriendlyException("Evidence must be a valid HTTP or HTTPS link.");
        }

        var entry = new ProjectProgressEntry
        {
            TenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required."),
            ProjectId = project.Id,
            DeveloperId = developer.Id,
            Title = title,
            Summary = summary,
            EvidenceUrl = evidenceUrl,
            SelfReview = selfReview,
        };
        await _entryRepository.InsertAsync(entry);
        await CurrentUnitOfWork.SaveChangesAsync();
        return (await MapEntries(project.Id, new List<ProjectProgressEntry> { entry })).Single();
    }

    public async Task<ProjectProgressEntryDto> ReviewProjectProgressEntry(ReviewProjectProgressEntryInput input)
    {
        if (input == null || input.EntryId == Guid.Empty || string.IsNullOrWhiteSpace(input.Comment))
        {
            throw new UserFriendlyException("A progress entry and review comment are required.");
        }

        var developer = await GetCurrentDeveloper();
        var entry = await _entryRepository.FirstOrDefaultAsync(input.EntryId)
            ?? throw new UserFriendlyException("Progress entry not found.");
        var project = await EnsureProjectMember(entry.ProjectId, developer.Id);
        if (entry.DeveloperId == developer.Id)
        {
            throw new UserFriendlyException("Use the self-review field to reflect on your own work.");
        }

        var comment = input.Comment.Trim();
        if (comment.Length < 5 || comment.Length > 2000)
        {
            throw new UserFriendlyException("Review comments must be between 5 and 2000 characters.");
        }

        var review = await _reviewRepository.GetAll()
            .FirstOrDefaultAsync(x => x.EntryId == entry.Id && x.ReviewerDeveloperId == developer.Id);
        if (review == null)
        {
            review = new ProjectProgressReview
            {
                TenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required."),
                EntryId = entry.Id,
                ReviewerDeveloperId = developer.Id,
                Comment = comment,
            };
            await _reviewRepository.InsertAsync(review);
        }
        else
        {
            review.Comment = comment;
            await _reviewRepository.UpdateAsync(review);
        }

        await CurrentUnitOfWork.SaveChangesAsync();
        return (await MapEntries(project.Id, new List<ProjectProgressEntry> { entry })).Single();
    }

    private async Task<Developer> GetCurrentDeveloper()
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        return await _developerRepository.GetAll().FirstOrDefaultAsync(x => x.UserId == userId)
            ?? throw new UserFriendlyException("Developer profile not found.");
    }

    private async Task<Project> EnsureProjectMember(Guid projectId, Guid developerId)
    {
        var project = await _projectRepository.FirstOrDefaultAsync(projectId)
            ?? throw new UserFriendlyException("Project not found.");
        var isMember = await _projectMemberRepository.GetAll()
            .AnyAsync(x => x.ProjectId == projectId && x.DeveloperId == developerId);
        if (!isMember)
        {
            throw new UserFriendlyException("You are not a member of this project.");
        }
        return project;
    }

    private async Task<List<ProjectProgressEntryDto>> MapEntries(
        Guid projectId,
        List<ProjectProgressEntry> entries)
    {
        if (entries.Count == 0) return new List<ProjectProgressEntryDto>();

        var entryIds = entries.Select(x => x.Id).ToList();
        var reviews = await _reviewRepository.GetAll()
            .Where(x => entryIds.Contains(x.EntryId))
            .OrderBy(x => x.CreationTime)
            .ToListAsync();
        var reviewerIds = reviews.Select(x => x.ReviewerDeveloperId).Distinct().ToList();
        var developerIds = entries.Select(x => x.DeveloperId).Concat(reviewerIds).Distinct().ToList();
        var developers = await _developerRepository.GetAll()
            .Where(x => developerIds.Contains(x.Id))
            .ToListAsync();
        var userIds = developers.Select(x => x.UserId).Distinct().ToList();
        var users = await _userRepository.GetAll()
            .Where(x => userIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x);
        var mentorIds = await _projectMemberRepository.GetAll()
            .Where(x => x.ProjectId == projectId && x.IsMentor)
            .Select(x => x.DeveloperId)
            .ToListAsync();
        var developerById = developers.ToDictionary(x => x.Id);

        string Name(Guid developerId)
        {
            if (!developerById.TryGetValue(developerId, out var developer) || !users.TryGetValue(developer.UserId, out var user))
            {
                return "Developer";
            }
            var fullName = string.Join(" ", new[] { user.Name, user.Surname }.Where(x => !string.IsNullOrWhiteSpace(x)));
            return string.IsNullOrWhiteSpace(fullName) ? user.UserName : fullName;
        }

        return entries.Select(entry => new ProjectProgressEntryDto
        {
            Id = entry.Id,
            ProjectId = entry.ProjectId,
            DeveloperId = entry.DeveloperId,
            AuthorName = Name(entry.DeveloperId),
            Title = entry.Title,
            Summary = entry.Summary,
            EvidenceUrl = entry.EvidenceUrl,
            SelfReview = entry.SelfReview,
            CreatedAt = entry.CreationTime,
            Reviews = reviews.Where(x => x.EntryId == entry.Id).Select(review => new ProjectProgressReviewDto
            {
                Id = review.Id,
                ReviewerDeveloperId = review.ReviewerDeveloperId,
                ReviewerName = Name(review.ReviewerDeveloperId),
                ReviewerRole = mentorIds.Contains(review.ReviewerDeveloperId) ? "mentor" : "teammate",
                Comment = review.Comment,
                CreatedAt = review.CreationTime,
            }).ToList(),
        }).ToList();
    }
}
