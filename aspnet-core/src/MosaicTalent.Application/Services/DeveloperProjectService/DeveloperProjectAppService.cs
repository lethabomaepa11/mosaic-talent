using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Services.AiService;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.DeveloperProjectService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperProjectService;

[AbpAuthorize]
public class DeveloperProjectAppService : MosaicTalentAppServiceBase, IDeveloperProjectAppService
{
    private readonly IRepository<Developer, Guid> _developerRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly IRepository<Project, Guid> _projectRepository;
    private readonly IRepository<ProjectMember, Guid> _projectMemberRepository;
    private readonly IRepository<ProjectSkill, Guid> _projectSkillRepository;
    private readonly IRepository<ProjectTask, Guid> _projectTaskRepository;
    private readonly IRepository<DeveloperProfile, Guid> _developerProfileRepository;
    private readonly IRepository<DeveloperProfileSkill, Guid> _developerProfileSkillRepository;
    private readonly IRepository<DeveloperProfileGoal, Guid> _developerProfileGoalRepository;
    private readonly IGroqChatService _groqChatService;

    public DeveloperProjectAppService(
        IRepository<Developer, Guid> developerRepository,
        IRepository<User, long> userRepository,
        IRepository<Project, Guid> projectRepository,
        IRepository<ProjectMember, Guid> projectMemberRepository,
        IRepository<ProjectSkill, Guid> projectSkillRepository,
        IRepository<ProjectTask, Guid> projectTaskRepository,
        IRepository<DeveloperProfile, Guid> developerProfileRepository,
        IRepository<DeveloperProfileSkill, Guid> developerProfileSkillRepository,
        IRepository<DeveloperProfileGoal, Guid> developerProfileGoalRepository,
        IGroqChatService groqChatService)
    {
        _developerRepository = developerRepository;
        _userRepository = userRepository;
        _projectRepository = projectRepository;
        _projectMemberRepository = projectMemberRepository;
        _projectSkillRepository = projectSkillRepository;
        _projectTaskRepository = projectTaskRepository;
        _developerProfileRepository = developerProfileRepository;
        _developerProfileSkillRepository = developerProfileSkillRepository;
        _developerProfileGoalRepository = developerProfileGoalRepository;
        _groqChatService = groqChatService;
    }

    public async Task<List<DeveloperProjectDto>> GetMyProjects()
    {
        var developer = await GetCurrentDeveloper();

        var myProjectIds = await _projectMemberRepository.GetAll()
            .Where(x => x.DeveloperId == developer.Id)
            .Select(x => x.ProjectId)
            .Distinct()
            .ToListAsync();

        var projects = await _projectRepository.GetAll()
            .Where(x => myProjectIds.Contains(x.Id))
            .OrderByDescending(x => x.CreationTime)
            .ToListAsync();

        return await MapProjects(projects);
    }

    public async Task<List<DeveloperProjectDto>> GetOpenProjects()
    {
        var developer = await GetCurrentDeveloper();
        var developerSkills = await GetDeveloperSkills(developer.Id);
        var developerGoals = await GetDeveloperGoals(developer.Id);

        var projects = await _projectRepository.GetAll()
            .Where(x => x.Status == ProjectStatus.Open)
            .OrderByDescending(x => x.CreationTime)
            .ToListAsync();

        var mapped = await MapProjects(projects);
        var sorted = mapped
            .OrderByDescending(project => ScoreProjectMatch(project, developerSkills, developerGoals))
            .ThenByDescending(project => project.CreatedAt)
            .ToList();

        foreach (var project in sorted)
        {
            project.MatchScore = CalculateMatchScore(project, developerSkills, developerGoals);
        }

        return sorted;
    }

    public async Task<DeveloperProjectDto> GetProject(GetDeveloperProjectInput input)
    {
        var project = await _projectRepository.FirstOrDefaultAsync(input.ProjectId)
            ?? throw new UserFriendlyException("Project not found.");
        var mapped = await MapProjects(new List<Project> { project });
        return mapped.First();
    }

    public async Task<DeveloperProjectDto> CreateProject(CreateDeveloperProjectInput input)
    {
        var developer = await GetCurrentDeveloper();
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");

        var normalizedSkills = (input.Skills ?? new List<string>())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var project = new Project
        {
            TenantId = tenantId,
            OwnerDeveloperId = developer.Id,
            Title = input.Title.Trim(),
            Description = input.Description.Trim(),
            MaxMembers = input.MaxMembers ?? 4,
            GithubRepo = input.GithubRepo?.Trim(),
            Type = input.Type,
            Status = input.Status,
        };

        await _projectRepository.InsertAsync(project);
        await CurrentUnitOfWork.SaveChangesAsync();

        await _projectMemberRepository.InsertAsync(new ProjectMember
        {
            TenantId = tenantId,
            ProjectId = project.Id,
            DeveloperId = developer.Id,
            Role = MemberRole.Lead,
        });

        foreach (var skill in normalizedSkills)
        {
            await _projectSkillRepository.InsertAsync(new ProjectSkill
            {
                TenantId = tenantId,
                ProjectId = project.Id,
                Name = skill,
            });
        }
        await CurrentUnitOfWork.SaveChangesAsync();

        var mapped = await MapProjects(new List<Project> { project });
        return mapped.First();
    }

    public async Task<DeveloperProjectDto> JoinProject(JoinDeveloperProjectInput input)
    {
        var developer = await GetCurrentDeveloper();
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");

        var project = await _projectRepository.FirstOrDefaultAsync(input.ProjectId)
            ?? throw new UserFriendlyException("Project not found.");

        if (project.OwnerDeveloperId == developer.Id)
        {
            throw new UserFriendlyException("You are already the owner of this project.");
        }

        if (project.Status != ProjectStatus.Open)
        {
            throw new UserFriendlyException("Only open projects can be joined.");
        }

        var existingMembership = await _projectMemberRepository.GetAll()
            .AnyAsync(x => x.ProjectId == project.Id && x.DeveloperId == developer.Id);

        if (existingMembership)
        {
            throw new UserFriendlyException("You are already a member of this project.");
        }

        var memberCount = await _projectMemberRepository.GetAll()
            .CountAsync(x => x.ProjectId == project.Id);

        if (memberCount >= (project.MaxMembers ?? 4))
        {
            throw new UserFriendlyException("Project is already full.");
        }

        await _projectMemberRepository.InsertAsync(new ProjectMember
        {
            TenantId = tenantId,
            ProjectId = project.Id,
            DeveloperId = developer.Id,
            Role = MemberRole.Member,
        });
        await CurrentUnitOfWork.SaveChangesAsync();

        var mapped = await MapProjects(new List<Project> { project });
        return mapped.First();
    }

    public async Task<DeveloperProjectDto> AiMatchProject()
    {
        var developer = await GetCurrentDeveloper();
        var developerSkills = await GetDeveloperSkills(developer.Id);
        var developerGoals = await GetDeveloperGoals(developer.Id);
        var openProjects = await GetOpenProjects();

        if (openProjects.Count == 0)
        {
            return null;
        }

        var selection = await SelectProjectWithGroq(openProjects, developerSkills, developerGoals);
        if (selection?.ProjectId != null)
        {
            var selected = openProjects.FirstOrDefault(x => x.Id == selection.ProjectId.Value);
            if (selected != null)
            {
                selected.MatchInsight = selection.Insight;
                selected.LearningOutcomes = selection.LearningOutcomes;
                return selected;
            }
        }

        var fallback = openProjects
            .OrderByDescending(project => project.MatchScore)
            .FirstOrDefault();
        if (fallback == null)
        {
            return null;
        }

        fallback.MatchInsight = BuildFallbackInsight(fallback, developerSkills, developerGoals);
        fallback.LearningOutcomes = BuildFallbackLearningOutcomes(fallback, developerSkills);
        return fallback;
    }

    public async Task<DeveloperProjectDto> AiFillTeam(GetDeveloperProjectInput input)
    {
        var developer = await GetCurrentDeveloper();
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");

        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        var myMembership = await _projectMemberRepository.GetAll()
            .FirstOrDefaultAsync(x => x.ProjectId == project.Id && x.DeveloperId == developer.Id)
            ?? throw new UserFriendlyException("Project membership not found.");

        if (project.OwnerDeveloperId != developer.Id && myMembership.Role != MemberRole.Lead)
        {
            throw new UserFriendlyException("Only project leads can fill the team.");
        }

        if (project.Status == ProjectStatus.Complete)
        {
            throw new UserFriendlyException("Completed projects cannot be updated.");
        }

        var maxMembers = project.MaxMembers ?? 4;

        var currentMembers = await _projectMemberRepository.GetAll()
            .Where(x => x.ProjectId == project.Id)
            .ToListAsync();

        var currentMemberIds = currentMembers.Select(x => x.DeveloperId).ToHashSet();
        var availableSlots = Math.Max(maxMembers - currentMembers.Count, 0);

        if (availableSlots > 0)
        {
            var candidates = await _developerRepository.GetAll()
                .Where(x => !currentMemberIds.Contains(x.Id))
                .OrderBy(x => x.CreationTime)
                .Take(40)
                .ToListAsync();

            var candidateIds = await SelectCandidatesWithGroq(project.Id, candidates, availableSlots);
            var selectedCandidates = candidates
                .Where(x => candidateIds.Contains(x.Id))
                .Take(availableSlots)
                .ToList();

            if (selectedCandidates.Count == 0)
            {
                selectedCandidates = (await RankCandidatesBySkills(project.Id, candidates))
                    .Take(availableSlots)
                    .ToList();
            }

            foreach (var candidate in selectedCandidates)
            {
                await _projectMemberRepository.InsertAsync(new ProjectMember
                {
                    TenantId = tenantId,
                    ProjectId = project.Id,
                    DeveloperId = candidate.Id,
                    Role = MemberRole.Member,
                });
            }

            await CurrentUnitOfWork.SaveChangesAsync();
        }

        var mapped = await MapProjects(new List<Project> { project });
        return mapped.First();
    }

    public async Task<DeveloperProjectTaskDto> AddProjectTask(AddProjectTaskInput input)
    {
        var developer = await GetCurrentDeveloper();
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);

        if (project.Status == ProjectStatus.Complete)
        {
            throw new UserFriendlyException("Completed projects cannot be updated.");
        }

        var task = new ProjectTask
        {
            TenantId = tenantId,
            ProjectId = project.Id,
            Title = input.Title.Trim(),
            Description = input.Description?.Trim(),
            Status = ProjectTaskStatus.Todo,
        };

        await _projectTaskRepository.InsertAsync(task);
        await CurrentUnitOfWork.SaveChangesAsync();

        return new DeveloperProjectTaskDto
        {
            Id = task.Id.ToString(),
            Title = task.Title,
            Description = task.Description,
            Status = ToTaskStatusLabel(task.Status),
        };
    }

    public async Task<DeveloperProjectTaskDto> UpdateProjectTaskStatus(UpdateProjectTaskStatusInput input)
    {
        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);

        if (project.Status == ProjectStatus.Complete)
        {
            throw new UserFriendlyException("Completed projects cannot be updated.");
        }

        var task = await _projectTaskRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == input.TaskId && x.ProjectId == input.ProjectId)
            ?? throw new UserFriendlyException("Task not found.");

        task.Status = ParseTaskStatus(input.Status);
        await _projectTaskRepository.UpdateAsync(task);
        await CurrentUnitOfWork.SaveChangesAsync();

        return new DeveloperProjectTaskDto
        {
            Id = task.Id.ToString(),
            Title = task.Title,
            Description = task.Description,
            Status = ToTaskStatusLabel(task.Status),
        };
    }

    public async Task<DeveloperProjectDto> UpdateProjectSkills(UpdateProjectSkillsInput input)
    {
        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);

        var myMembership = await _projectMemberRepository.GetAll()
            .FirstOrDefaultAsync(x => x.ProjectId == project.Id && x.DeveloperId == developer.Id)
            ?? throw new UserFriendlyException("Project membership not found.");

        if (project.OwnerDeveloperId != developer.Id && myMembership.Role != MemberRole.Lead)
        {
            throw new UserFriendlyException("Only project leads can update project skills.");
        }

        if (project.Status == ProjectStatus.Complete)
        {
            throw new UserFriendlyException("Completed projects cannot be updated.");
        }

        var normalizedSkills = (input.Skills ?? new List<string>())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var existing = await _projectSkillRepository.GetAll()
            .Where(x => x.ProjectId == project.Id)
            .ToListAsync();

        foreach (var skill in existing)
        {
            await _projectSkillRepository.DeleteAsync(skill);
        }

        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        foreach (var skill in normalizedSkills)
        {
            await _projectSkillRepository.InsertAsync(new ProjectSkill
            {
                TenantId = tenantId,
                ProjectId = project.Id,
                Name = skill,
            });
        }

        await CurrentUnitOfWork.SaveChangesAsync();

        var mapped = await MapProjects(new List<Project> { project });
        return mapped.First();
    }

    public async Task<DeveloperProjectDto> CompleteProject(GetDeveloperProjectInput input)
    {
        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);

        var myMembership = await _projectMemberRepository.GetAll()
            .FirstOrDefaultAsync(x => x.ProjectId == project.Id && x.DeveloperId == developer.Id)
            ?? throw new UserFriendlyException("Project membership not found.");

        if (project.OwnerDeveloperId != developer.Id && myMembership.Role != MemberRole.Lead)
        {
            throw new UserFriendlyException("Only project leads can complete projects.");
        }

        var tasks = await _projectTaskRepository.GetAll()
            .Where(x => x.ProjectId == project.Id)
            .ToListAsync();

        if (tasks.Count == 0)
        {
            throw new UserFriendlyException("Add at least one task before completing a project.");
        }

        if (tasks.Any(x => x.Status != ProjectTaskStatus.Done))
        {
            throw new UserFriendlyException("All project tasks must be in Done before completion.");
        }

        project.Status = ProjectStatus.Complete;
        await _projectRepository.UpdateAsync(project);
        await CurrentUnitOfWork.SaveChangesAsync();

        var mapped = await MapProjects(new List<Project> { project });
        return mapped.First();
    }

    private async Task<Developer> GetCurrentDeveloper()
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var developer = await _developerRepository.GetAll()
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (developer == null)
        {
            throw new UserFriendlyException("Developer profile not found.");
        }

        return developer;
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

    private async Task<List<DeveloperProjectDto>> MapProjects(List<Project> projects)
    {
        if (projects.Count == 0)
        {
            return new List<DeveloperProjectDto>();
        }

        var projectIds = projects.Select(x => x.Id).ToList();
        var members = await _projectMemberRepository.GetAll()
            .Where(x => projectIds.Contains(x.ProjectId))
            .ToListAsync();

        var tasks = await _projectTaskRepository.GetAll()
            .Where(x => projectIds.Contains(x.ProjectId))
            .OrderBy(x => x.CreationTime)
            .ToListAsync();

        var developerIds = members.Select(x => x.DeveloperId).Distinct().ToList();
        var skills = await _projectSkillRepository.GetAll()
            .Where(x => projectIds.Contains(x.ProjectId))
            .ToListAsync();
        var developers = await _developerRepository.GetAll()
            .Where(x => developerIds.Contains(x.Id))
            .ToListAsync();

        var userIds = developers.Select(x => x.UserId).Distinct().ToList();
        var users = await _userRepository.GetAll()
            .Where(x => userIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x);

        return projects.Select(project =>
        {
            var projectMembers = members
                .Where(x => x.ProjectId == project.Id)
                .ToList();

            var memberDtos = projectMembers.Select(member =>
            {
                var memberDeveloper = developers.FirstOrDefault(x => x.Id == member.DeveloperId);
                users.TryGetValue(memberDeveloper?.UserId ?? 0, out var user);
                var fullName = string.Join(" ", new[] { user?.Name, user?.Surname }.Where(x => !string.IsNullOrWhiteSpace(x)));

                return new DeveloperProjectMemberDto
                {
                    Id = member.DeveloperId,
                    Name = string.IsNullOrWhiteSpace(fullName) ? user?.UserName ?? "Developer" : fullName,
                    Avatar = user?.AvatarUrl ?? string.Empty,
                    Role = member.Role == MemberRole.Lead ? "lead" : "member",
                };
            }).ToList();

            var taskDtos = tasks
                .Where(x => x.ProjectId == project.Id)
                .Select(task => new DeveloperProjectTaskDto
                {
                    Id = task.Id.ToString(),
                    Title = task.Title,
                    Description = task.Description,
                    Status = ToTaskStatusLabel(task.Status),
                })
                .ToList();

            return new DeveloperProjectDto
            {
                Id = project.Id,
                Title = project.Title,
                Description = project.Description,
                MaxMembers = project.MaxMembers,
                GithubRepo = project.GithubRepo,
                Skills = skills
                    .Where(x => x.ProjectId == project.Id)
                    .Select(x => x.Name)
                    .ToList(),
                Type = project.Type.ToString().ToLowerInvariant(),
                Status = ToStatusLabel(project.Status),
                OwnerId = project.OwnerDeveloperId.ToString(),
                CreatedAt = project.CreationTime,
                Members = memberDtos,
                Tasks = taskDtos,
            };
        }).ToList();
    }

    private async Task<ProjectMatchSelection> SelectProjectWithGroq(
        List<DeveloperProjectDto> openProjects,
        List<string> developerSkills,
        List<string> developerGoals)
    {
        if (!_groqChatService.IsConfigured())
        {
            return null;
        }

        var payload = new
        {
            developer = new
            {
                skills = developerSkills,
                goals = developerGoals,
            },
            projects = openProjects.Select(project => new
            {
                id = project.Id,
                title = project.Title,
                description = project.Description,
                skills = project.Skills,
                status = project.Status,
                maxMembers = project.MaxMembers,
                currentMembers = project.Members.Count,
            }),
        };

        var systemPrompt = "You are a project matching assistant. Return only JSON with {\"projectId\":\"<guid or empty>\",\"insight\":\"short reason\",\"learningOutcomes\":[\"item\"]}.";
        var userPrompt = JsonSerializer.Serialize(payload);
        var response = await _groqChatService.TryCompleteAsync(systemPrompt, userPrompt);
        if (string.IsNullOrWhiteSpace(response))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(response);
            if (!document.RootElement.TryGetProperty("projectId", out var projectIdElement))
            {
                return null;
            }

            if (!Guid.TryParse(projectIdElement.GetString(), out var projectId))
            {
                return null;
            }

            if (!openProjects.Any(x => x.Id == projectId))
            {
                return null;
            }

            var insight = document.RootElement.TryGetProperty("insight", out var insightElement)
                ? insightElement.GetString()
                : null;
            var learningOutcomes = new List<string>();
            if (document.RootElement.TryGetProperty("learningOutcomes", out var learningElement) &&
                learningElement.ValueKind == JsonValueKind.Array)
            {
                learningOutcomes = learningElement
                    .EnumerateArray()
                    .Select(x => x.GetString())
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .ToList();
            }

            return new ProjectMatchSelection
            {
                ProjectId = projectId,
                Insight = insight,
                LearningOutcomes = learningOutcomes,
            };
        }
        catch
        {
            return null;
        }
    }

    private static int ScoreProjectMatch(
        DeveloperProjectDto project,
        IReadOnlyCollection<string> developerSkills,
        IReadOnlyCollection<string> developerGoals)
    {
        return CalculateMatchScore(project, developerSkills, developerGoals);
    }

    private static int CalculateMatchScore(
        DeveloperProjectDto project,
        IReadOnlyCollection<string> developerSkills,
        IReadOnlyCollection<string> developerGoals)
    {
        var normalizedDeveloperSkills = developerSkills
            .Where(skill => !string.IsNullOrWhiteSpace(skill))
            .Select(NormalizeSkillToken)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        var normalizedProjectSkills = project.Skills
            .Where(skill => !string.IsNullOrWhiteSpace(skill))
            .Select(NormalizeSkillToken)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var overlap = normalizedProjectSkills.Count(projectSkill =>
            normalizedDeveloperSkills.Any(devSkill => SkillTokensMatch(devSkill, projectSkill)));
        var totalProjectSkills = Math.Max(normalizedProjectSkills.Count, 1);
        var skillCoverage = (double)overlap / totalProjectSkills;

        var goalsCount = Math.Max(developerGoals.Count, 1);
        var projectText = $"{project.Title} {project.Description} {string.Join(" ", project.Skills)}";
        var goalHits = developerGoals.Count(goal =>
            !string.IsNullOrWhiteSpace(goal) &&
            ContainsRelaxed(projectText, goal));
        var goalCoverage = (double)goalHits / goalsCount;

        var maxMembers = project.MaxMembers.GetValueOrDefault(4);
        if (maxMembers <= 0)
        {
            maxMembers = 4;
        }
        var availableSlots = Math.Max(maxMembers - project.Members.Count, 0);
        var availabilityRatio = (double)availableSlots / Math.Max(maxMembers, 1);

        var weighted =
            (Math.Min(skillCoverage, 1) * 0.75) +
            (Math.Min(goalCoverage, 1) * 0.15) +
            (Math.Min(availabilityRatio, 1) * 0.1);

        var boosted = 35 + (weighted * 65);
        if (overlap > 0 && boosted < 55)
        {
            boosted = 55;
        }

        if (overlap >= Math.Max(1, totalProjectSkills - 1) && goalHits > 0)
        {
            boosted = Math.Max(boosted, 85);
        }

        var capped = Math.Min(boosted, 100);
        return (int)Math.Round(capped, MidpointRounding.AwayFromZero);
    }

    private static string NormalizeSkillToken(string value)
    {
        var token = value.Trim().ToLowerInvariant();
        return token switch
        {
            "js" => "javascript",
            "node" => "nodejs",
            "node.js" => "nodejs",
            "ts" => "typescript",
            "py" => "python",
            "postgres" => "postgresql",
            "c#" => "dotnet",
            ".net" => "dotnet",
            "asp.net" => "dotnet",
            _ => token,
        };
    }

    private static bool SkillTokensMatch(string developerSkill, string projectSkill)
    {
        if (string.Equals(developerSkill, projectSkill, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return developerSkill.Contains(projectSkill, StringComparison.OrdinalIgnoreCase) ||
               projectSkill.Contains(developerSkill, StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsRelaxed(string haystack, string needle)
    {
        if (string.IsNullOrWhiteSpace(haystack) || string.IsNullOrWhiteSpace(needle))
        {
            return false;
        }

        var normalizedHaystack = NormalizeText(haystack);
        var normalizedNeedle = NormalizeText(needle);
        return normalizedHaystack.Contains(normalizedNeedle, StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeText(string value)
    {
        var normalized = value.Trim().ToLowerInvariant();
        normalized = normalized
            .Replace("node.js", "nodejs")
            .Replace("node js", "nodejs")
            .Replace("javascript", "javascript")
            .Replace(" js ", " javascript ")
            .Replace("typescript", "typescript")
            .Replace(" ts ", " typescript ")
            .Replace("postgres", "postgresql")
            .Replace("asp.net", "dotnet")
            .Replace(".net", "dotnet")
            .Replace("c#", "dotnet");

        return normalized;
    }

    private async Task<HashSet<Guid>> SelectCandidatesWithGroq(Guid projectId, List<Developer> candidates, int availableSlots)
    {
        if (!_groqChatService.IsConfigured() || availableSlots <= 0 || candidates.Count == 0)
        {
            return new HashSet<Guid>();
        }

        var projectSkills = await _projectSkillRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .Select(x => x.Name)
            .ToListAsync();

        var candidateProfiles = await BuildCandidateProfiles(candidates);

        var payload = new
        {
            slots = availableSlots,
            projectSkills,
            candidates = candidateProfiles.Select(x => new
            {
                id = x.DeveloperId,
                yearsOfExperience = x.YearsOfExperience,
                teamworkRating = x.TeamworkRating,
                skills = x.Skills,
            }),
        };

        var systemPrompt = "Pick the best candidates for the project. Return only JSON: {\"developerIds\":[\"<guid>\"]}.";
        var userPrompt = JsonSerializer.Serialize(payload);
        var response = await _groqChatService.TryCompleteAsync(systemPrompt, userPrompt);
        if (string.IsNullOrWhiteSpace(response))
        {
            return new HashSet<Guid>();
        }

        try
        {
            using var document = JsonDocument.Parse(response);
            if (!document.RootElement.TryGetProperty("developerIds", out var idsElement) ||
                idsElement.ValueKind != JsonValueKind.Array)
            {
                return new HashSet<Guid>();
            }

            var allowed = candidates.Select(x => x.Id).ToHashSet();
            var selected = new HashSet<Guid>();
            foreach (var idValue in idsElement.EnumerateArray())
            {
                if (Guid.TryParse(idValue.GetString(), out var parsedId) && allowed.Contains(parsedId))
                {
                    selected.Add(parsedId);
                    if (selected.Count >= availableSlots)
                    {
                        break;
                    }
                }
            }

            return selected;
        }
        catch
        {
            return new HashSet<Guid>();
        }
    }

    private async Task<List<Developer>> RankCandidatesBySkills(Guid projectId, List<Developer> candidates)
    {
        if (candidates.Count == 0)
        {
            return new List<Developer>();
        }

        var projectSkills = await _projectSkillRepository.GetAll()
            .Where(x => x.ProjectId == projectId)
            .Select(x => x.Name)
            .ToListAsync();
        var projectSkillSet = new HashSet<string>(projectSkills, StringComparer.OrdinalIgnoreCase);
        var candidateProfiles = await BuildCandidateProfiles(candidates);

        var rankedIds = candidateProfiles
            .OrderByDescending(candidate => candidate.Skills.Count(skill => projectSkillSet.Contains(skill)))
            .ThenByDescending(candidate => candidate.TeamworkRating)
            .ThenByDescending(candidate => candidate.YearsOfExperience ?? 0)
            .Select(candidate => candidate.DeveloperId)
            .ToList();

        var idOrder = rankedIds
            .Select((id, index) => new { id, index })
            .ToDictionary(x => x.id, x => x.index);

        return candidates
            .OrderBy(candidate => idOrder.TryGetValue(candidate.Id, out var index) ? index : int.MaxValue)
            .ToList();
    }

    private async Task<List<DeveloperCandidateProfile>> BuildCandidateProfiles(List<Developer> candidates)
    {
        var candidateIds = candidates.Select(x => x.Id).ToList();

        var profiles = await _developerProfileRepository.GetAll()
            .Where(x => candidateIds.Contains(x.DeveloperId))
            .ToListAsync();

        var profileIds = profiles.Select(x => x.Id).ToList();
        var profileSkills = await _developerProfileSkillRepository.GetAll()
            .Where(x => profileIds.Contains(x.ProfileId))
            .ToListAsync();

        return candidates.Select(candidate =>
        {
            var profile = profiles.FirstOrDefault(x => x.DeveloperId == candidate.Id);
            var skills = profile == null
                ? new List<string>()
                : profileSkills
                    .Where(x => x.ProfileId == profile.Id)
                    .Select(x => x.Name)
                    .ToList();

            return new DeveloperCandidateProfile
            {
                DeveloperId = candidate.Id,
                YearsOfExperience = candidate.YearsOfExperience,
                TeamworkRating = profile?.TeamworkRating ?? 0,
                Skills = skills,
            };
        }).ToList();
    }

    private async Task<List<string>> GetDeveloperSkills(Guid developerId)
    {
        var profile = await _developerProfileRepository.GetAll()
            .FirstOrDefaultAsync(x => x.DeveloperId == developerId);

        if (profile == null)
        {
            return new List<string>();
        }

        return await _developerProfileSkillRepository.GetAll()
            .Where(x => x.ProfileId == profile.Id)
            .Select(x => x.Name)
            .ToListAsync();
    }

    private async Task<List<string>> GetDeveloperGoals(Guid developerId)
    {
        var profile = await _developerProfileRepository.GetAll()
            .FirstOrDefaultAsync(x => x.DeveloperId == developerId);

        if (profile == null)
        {
            return new List<string>();
        }

        return await _developerProfileGoalRepository.GetAll()
            .Where(x => x.ProfileId == profile.Id)
            .Select(x => x.Goal)
            .ToListAsync();
    }

    private class DeveloperCandidateProfile
    {
        public Guid DeveloperId { get; set; }
        public int? YearsOfExperience { get; set; }
        public double TeamworkRating { get; set; }
        public List<string> Skills { get; set; } = new();
    }

    private class ProjectMatchSelection
    {
        public Guid? ProjectId { get; set; }
        public string Insight { get; set; }
        public List<string> LearningOutcomes { get; set; } = new();
    }

    private static string BuildFallbackInsight(
        DeveloperProjectDto project,
        IReadOnlyCollection<string> developerSkills,
        IReadOnlyCollection<string> developerGoals)
    {
        var skillSet = new HashSet<string>(developerSkills, StringComparer.OrdinalIgnoreCase);
        var overlaps = project.Skills.Where(skill => skillSet.Contains(skill)).Take(3).ToList();
        var goalHint = developerGoals.FirstOrDefault(goal =>
            !string.IsNullOrWhiteSpace(goal) &&
            project.Description.Contains(goal, StringComparison.OrdinalIgnoreCase));

        if (overlaps.Count > 0 && !string.IsNullOrWhiteSpace(goalHint))
        {
            return $"Strong overlap with your skills ({string.Join(", ", overlaps)}) and aligns with your goal: {goalHint}.";
        }

        if (overlaps.Count > 0)
        {
            return $"Strong overlap with your current skills: {string.Join(", ", overlaps)}.";
        }

        if (!string.IsNullOrWhiteSpace(goalHint))
        {
            return $"This project aligns with your stated goal: {goalHint}.";
        }

        return "This project offers the best available fit based on your profile and open team slots.";
    }

    private static List<string> BuildFallbackLearningOutcomes(
        DeveloperProjectDto project,
        IReadOnlyCollection<string> developerSkills)
    {
        var skillSet = new HashSet<string>(developerSkills, StringComparer.OrdinalIgnoreCase);
        var newSkills = project.Skills.Where(skill => !skillSet.Contains(skill)).Take(3).ToList();

        if (newSkills.Count > 0)
        {
            return newSkills.Select(skill => $"Build practical experience in {skill}.").ToList();
        }

        return new List<string>
        {
            "Deepen collaboration in a real delivery team.",
            "Improve project execution from planning to completion.",
        };
    }

    private static string ToStatusLabel(ProjectStatus status)
    {
        return status switch
        {
            ProjectStatus.Draft => "draft",
            ProjectStatus.InProgress => "in-progress",
            ProjectStatus.Complete => "completed",
            _ => "open",
        };
    }

    private static string ToTaskStatusLabel(ProjectTaskStatus status)
    {
        return status switch
        {
            ProjectTaskStatus.InProgress => "in-progress",
            ProjectTaskStatus.Done => "done",
            _ => "todo",
        };
    }

    private static ProjectTaskStatus ParseTaskStatus(string input)
    {
        var normalized = input?.Trim().ToLowerInvariant();

        return normalized switch
        {
            "todo" => ProjectTaskStatus.Todo,
            "in-progress" => ProjectTaskStatus.InProgress,
            "done" => ProjectTaskStatus.Done,
            _ => throw new UserFriendlyException("Invalid task status."),
        };
    }
}
