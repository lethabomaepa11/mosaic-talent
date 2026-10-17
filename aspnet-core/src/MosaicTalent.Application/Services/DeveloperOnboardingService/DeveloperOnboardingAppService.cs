using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.AiService;
using MosaicTalent.Services.DeveloperOnboardingService.DTO;
using MosaicTalent.Services.GamificationService;
using MosaicTalent.Services.GamificationService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperOnboardingService;

[AbpAuthorize]
public partial class DeveloperOnboardingAppService : MosaicTalentAppServiceBase, IDeveloperOnboardingAppService
{
    private readonly IRepository<Developer, Guid> _developerRepository;
    private readonly IRepository<DeveloperProfile, Guid> _profileRepository;
    private readonly IRepository<DeveloperProfileSkill, Guid> _profileSkillRepository;
    private readonly IRepository<DeveloperProfileGoal, Guid> _profileGoalRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly IRepository<Project, Guid> _projectRepository;
    private readonly IRepository<ProjectMember, Guid> _projectMemberRepository;
    private readonly IRepository<ProjectSkill, Guid> _projectSkillRepository;
    private readonly IGroqChatService _groqChatService;
    private readonly IDeveloperGamificationService _developerGamificationService;
    private readonly ITeamworkRatingService _teamworkRatingService;

    public DeveloperOnboardingAppService(
        IRepository<Developer, Guid> developerRepository,
        IRepository<DeveloperProfile, Guid> profileRepository,
        IRepository<DeveloperProfileSkill, Guid> profileSkillRepository,
        IRepository<DeveloperProfileGoal, Guid> profileGoalRepository,
        IRepository<User, long> userRepository,
        IRepository<Project, Guid> projectRepository,
        IRepository<ProjectMember, Guid> projectMemberRepository,
        IRepository<ProjectSkill, Guid> projectSkillRepository,
        IGroqChatService groqChatService,
        IDeveloperGamificationService developerGamificationService,
        ITeamworkRatingService teamworkRatingService)
    {
        _developerRepository = developerRepository;
        _profileRepository = profileRepository;
        _profileSkillRepository = profileSkillRepository;
        _profileGoalRepository = profileGoalRepository;
        _userRepository = userRepository;
        _projectRepository = projectRepository;
        _projectMemberRepository = projectMemberRepository;
        _projectSkillRepository = projectSkillRepository;
        _groqChatService = groqChatService;
        _developerGamificationService = developerGamificationService;
        _teamworkRatingService = teamworkRatingService;
    }

}
