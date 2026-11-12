using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Notifications;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Domains.Reviews;
using MosaicTalent.Services.GamificationService;
using MosaicTalent.Services.GamificationService.DTO;
using MosaicTalent.Services.DeveloperOnboardingService;
using MosaicTalent.Services.NotificationChannelService;
using MosaicTalent.Services.PeerReviewService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace MosaicTalent.Services.PeerReviewService;

[AbpAuthorize]
public partial class PeerReviewAppService : MosaicTalentAppServiceBase, IPeerReviewAppService
{
    private const string AnonymousDisplayName = "Anonymous teammate";
    private readonly IRepository<Developer, Guid> _developerRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly IRepository<Project, Guid> _projectRepository;
    private readonly IRepository<ProjectMember, Guid> _projectMemberRepository;
    private readonly IRepository<PeerReview, Guid> _peerReviewRepository;
    private readonly IRepository<AIReviewQuestion, Guid> _questionRepository;
    private readonly IRepository<ReviewAnswer, Guid> _answerRepository;
    private readonly IRepository<AIReviewFeedback, Guid> _feedbackRepository;
    private readonly IPeerReviewGenerationService _generationService;
    private readonly INotificationEventDispatcher _notificationEventDispatcher;
    private readonly IDeveloperGamificationService _developerGamificationService;
    private readonly ITeamworkRatingService _teamworkRatingService;

    public PeerReviewAppService(
        IRepository<Developer, Guid> developerRepository,
        IRepository<User, long> userRepository,
        IRepository<Project, Guid> projectRepository,
        IRepository<ProjectMember, Guid> projectMemberRepository,
        IRepository<PeerReview, Guid> peerReviewRepository,
        IRepository<AIReviewQuestion, Guid> questionRepository,
        IRepository<ReviewAnswer, Guid> answerRepository,
        IRepository<AIReviewFeedback, Guid> feedbackRepository,
        IPeerReviewGenerationService generationService,
        INotificationEventDispatcher notificationEventDispatcher,
        IDeveloperGamificationService developerGamificationService,
        ITeamworkRatingService teamworkRatingService)
    {
        _developerRepository = developerRepository;
        _userRepository = userRepository;
        _projectRepository = projectRepository;
        _projectMemberRepository = projectMemberRepository;
        _peerReviewRepository = peerReviewRepository;
        _questionRepository = questionRepository;
        _answerRepository = answerRepository;
        _feedbackRepository = feedbackRepository;
        _generationService = generationService;
        _notificationEventDispatcher = notificationEventDispatcher;
        _developerGamificationService = developerGamificationService;
        _teamworkRatingService = teamworkRatingService;
    }

    public async Task<List<ProjectPeerReviewsDto>> GetMyProjectPeerReviews()
    {
        var developer = await GetCurrentDeveloper();
        var projectIds = await _projectMemberRepository.GetAll()
            .Where(x => x.DeveloperId == developer.Id)
            .Select(x => x.ProjectId)
            .Distinct()
            .ToListAsync();

        if (projectIds.Count == 0)
        {
            return new List<ProjectPeerReviewsDto>();
        }

        var assignedProjectIds = await _peerReviewRepository.GetAll()
            .Where(x => x.ReviewerDeveloperId == developer.Id)
            .Select(x => x.ProjectId)
            .Distinct()
            .ToListAsync();

        var projects = await _projectRepository.GetAll()
            .Where(x => projectIds.Contains(x.Id) &&
                (x.Status == ProjectStatus.Complete || assignedProjectIds.Contains(x.Id)))
            .OrderByDescending(x => x.LastModificationTime ?? x.CreationTime)
            .ToListAsync();

        var result = new List<ProjectPeerReviewsDto>();
        foreach (var project in projects)
        {
            var tenantId = project.TenantId;
            await _generationService.EnsureGeneratedForProject(project.Id, tenantId);
            result.Add(await BuildProjectReviews(project.Id, developer.Id));
        }

        return result;
    }

    public async Task<ProjectPeerReviewsDto> GetProjectPeerReviews(GetProjectPeerReviewsInput input)
    {
        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        await _generationService.EnsureGeneratedForProject(project.Id, project.TenantId);
        return await BuildProjectReviews(project.Id, developer.Id);
    }

    public async Task<ProjectPeerReviewsDto> GenerateProjectPeerReviews(GenerateProjectPeerReviewsInput input)
    {
        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        await _generationService.EnsureGeneratedForProject(project.Id, project.TenantId);
        return await BuildProjectReviews(project.Id, developer.Id);
    }

    public async Task<ProjectPeerReviewsDto> RequestProjectPeerReview(GenerateProjectPeerReviewsInput input)
    {
        var developer = await GetCurrentDeveloper();
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        await _generationService.RequestPeerReviewFromTeammates(project.Id, tenantId, developer.Id);
        return await BuildProjectReviews(project.Id, developer.Id);
    }

}
