using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.DeveloperProjectService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
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

    public DeveloperProjectAppService(
        IRepository<Developer, Guid> developerRepository,
        IRepository<User, long> userRepository,
        IRepository<Project, Guid> projectRepository,
        IRepository<ProjectMember, Guid> projectMemberRepository,
        IRepository<ProjectSkill, Guid> projectSkillRepository,
        IRepository<ProjectTask, Guid> projectTaskRepository)
    {
        _developerRepository = developerRepository;
        _userRepository = userRepository;
        _projectRepository = projectRepository;
        _projectMemberRepository = projectMemberRepository;
        _projectSkillRepository = projectSkillRepository;
        _projectTaskRepository = projectTaskRepository;
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

        var projects = await _projectRepository.GetAll()
            .Where(x => x.Status == ProjectStatus.Open)
            .OrderByDescending(x => x.CreationTime)
            .ToListAsync();

        var members = await _projectMemberRepository.GetAll()
            .Where(x => projects.Select(p => p.Id).Contains(x.ProjectId))
            .ToListAsync();

        var myProjectIds = members
            .Where(x => x.DeveloperId == developer.Id)
            .Select(x => x.ProjectId)
            .ToHashSet();

        var openProjects = projects.Where(project =>
        {
            if (project.OwnerDeveloperId == developer.Id)
            {
                return false;
            }

            if (myProjectIds.Contains(project.Id))
            {
                return false;
            }

            var memberCount = members.Count(m => m.ProjectId == project.Id);
            return memberCount < (project.MaxMembers ?? 4);
        }).ToList();

        return await MapProjects(openProjects);
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
        var openProjects = await GetOpenProjects();
        return openProjects.FirstOrDefault();
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
                .Take(availableSlots)
                .ToListAsync();

            foreach (var candidate in candidates)
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
