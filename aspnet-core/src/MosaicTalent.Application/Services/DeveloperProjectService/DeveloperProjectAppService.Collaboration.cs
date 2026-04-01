using Abp.Notifications;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.DeveloperProjectService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperProjectService;

public partial class DeveloperProjectAppService
{
    private const int RecommendedActiveProjectLimit = 3;
    private const int RecommendedWorkloadScoreLimit = 160;

    public async Task<RepositoryReadmeDto> GetRepositoryReadme(RepositoryReadmeInput input)
    {
        var developer = await GetCurrentDeveloper();
        var token = ResolveGithubAccessToken(developer);
        var availableRepos = await FetchGithubRepositories(developer);
        var selected = ResolveSelectedRepository(availableRepos, input?.GithubRepo ?? string.Empty)
            ?? throw new UserFriendlyException("Selected GitHub repository was not found in your connected account.");

        var repoKey = selected.FullName ?? string.Empty;
        if (string.IsNullOrWhiteSpace(repoKey) || !repoKey.Contains('/'))
        {
            throw new UserFriendlyException("Invalid GitHub repository selection.");
        }

        var request = BuildGithubRequest(
            HttpMethod.Get,
            $"https://api.github.com/repos/{repoKey}/readme",
            token);
        request.Headers.Accept.Clear();
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github.raw+json"));

        var client = _httpClientFactory.CreateClient();
        using var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            throw new UserFriendlyException(
                ExtractGithubError(content) ?? "Failed to load README from selected repository.");
        }

        var trimmed = content?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            throw new UserFriendlyException("Selected repository does not contain a readable README.");
        }

        return new RepositoryReadmeDto
        {
            RepoKey = repoKey,
            Content = trimmed.Length > 7000 ? trimmed.Substring(0, 7000) : trimmed,
        };
    }

    public async Task<AiGeneratedProjectSpecDto> AiGenerateProjectSpec(AiGenerateProjectSpecInput input)
    {
        var prompt = (input?.Prompt ?? string.Empty).Trim();
        var repoHint = (input?.RepoNameHint ?? string.Empty).Trim();
        var fallback = BuildFallbackProjectSpec(prompt, repoHint);

        if (!_groqChatService.IsConfigured())
        {
            return fallback;
        }

        var response = await _groqChatService.TryCompleteAsync(
            BuildProjectSpecSystemPrompt(),
            BuildProjectSpecPromptPayload(prompt, repoHint));
        if (string.IsNullOrWhiteSpace(response))
        {
            return fallback;
        }

        try
        {
            return ParseAiProjectSpecResponse(response, prompt, repoHint, fallback);
        }
        catch
        {
            return fallback;
        }
    }

    public async Task<ProjectJoinLoadWarningDto> GetJoinProjectLoadWarning(GetDeveloperProjectInput input)
    {
        if (input == null || input.ProjectId == Guid.Empty)
        {
            throw new UserFriendlyException("Project is required.");
        }

        var developer = await GetCurrentDeveloper();
        var project = await _projectRepository.FirstOrDefaultAsync(input.ProjectId)
            ?? throw new UserFriendlyException("Project not found.");

        return await BuildJoinLoadWarning(developer.Id, project);
    }

    public async Task<List<DeveloperProjectTaskDto>> AiGenerateProjectTasks(AiGenerateProjectTasksInput input)
    {
        if (input == null || input.ProjectId == Guid.Empty)
        {
            throw new UserFriendlyException("Project is required.");
        }

        var developer = await GetCurrentDeveloper();
        var project = await EnsureProjectMember(input.ProjectId, developer.Id);
        if (project.Status == ProjectStatus.Complete)
        {
            throw new UserFriendlyException("Completed projects cannot be updated.");
        }

        var membership = await _projectMemberRepository.GetAll()
            .FirstOrDefaultAsync(x => x.ProjectId == project.Id && x.DeveloperId == developer.Id)
            ?? throw new UserFriendlyException("Project membership not found.");
        if (project.OwnerDeveloperId != developer.Id && membership.Role != MemberRole.Lead)
        {
            throw new UserFriendlyException("Only project leads can generate tasks with AI.");
        }

        var members = await _projectMemberRepository.GetAll()
            .Where(x => x.ProjectId == project.Id)
            .ToListAsync();
        var memberIds = members.Select(x => x.DeveloperId).Distinct().ToList();
        if (memberIds.Count == 0)
        {
            throw new UserFriendlyException("No project members found for task assignment.");
        }

        var memberSkillMap = await BuildMemberSkillMap(memberIds);
        var generated = await TryGenerateTasksWithAi(project, memberSkillMap);
        if (generated.Count == 0)
        {
            generated = BuildFallbackTasks(project, memberSkillMap);
        }

        var tenantId = project.TenantId;
        var created = new List<ProjectTask>();
        foreach (var item in generated.Take(8))
        {
            var assignedId = item.AssignedDeveloperId;
            var task = new ProjectTask
            {
                TenantId = tenantId,
                ProjectId = project.Id,
                Title = item.Title,
                Description = item.Description,
                Status = ProjectTaskStatus.Todo,
                AssignedDeveloperId = assignedId,
            };
            await _projectTaskRepository.InsertAsync(task);
            created.Add(task);
        }

        await CurrentUnitOfWork.SaveChangesAsync();
        var createdDtos = new List<DeveloperProjectTaskDto>();
        foreach (var task in created)
        {
            createdDtos.Add(new DeveloperProjectTaskDto
            {
                Id = task.Id.ToString(),
                Title = task.Title,
                Description = task.Description,
                Status = ToTaskStatusLabel(task.Status),
                AssignedMemberId = task.AssignedDeveloperId?.ToString() ?? string.Empty,
                AssignedMemberName = task.AssignedDeveloperId.HasValue
                    ? await ResolveDeveloperDisplayName(task.AssignedDeveloperId.Value)
                    : string.Empty,
            });
        }

        return createdDtos;
    }

    private async Task PersistProjectRepoSafetyAndNotify(Project project, RepoSafetyScanResultDto scanResult)
    {
        if (project == null || scanResult?.Result == null)
        {
            return;
        }

        var result = scanResult.Result;
        var signature = string.IsNullOrWhiteSpace(result.CommitSha)
            ? $"{result.RiskLevel}:{result.ScannedAt:O}:{result.RiskScore}"
            : result.CommitSha.Trim();
        project.LastRepoSafetyScanAtUtc = result.ScannedAt ?? DateTime.UtcNow;
        project.LastRepoSafetyRiskLevel = (result.RiskLevel ?? string.Empty).Trim();
        project.LastRepoSafetyCommitSha = signature;
        await _projectRepository.UpdateAsync(project);
        await CurrentUnitOfWork.SaveChangesAsync();

        if (!IsRepoSafe(scanResult))
        {
            if (string.Equals(project.LastUnsafeAlertCommitSha, signature, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var userIds = await ResolveProjectMemberUserIds(project.Id);
            if (userIds.Count > 0)
            {
                var message = $"Safety warning in \"{project.Title}\": potential malicious code was detected.";
                await _notificationEventDispatcher.NotifyUsersAsync(
                    project.TenantId,
                    userIds,
                    "MosaicTalent.ProjectRepoUnsafe",
                    message,
                    NotificationSeverity.Warn,
                    $"/app/projects/{project.Id}",
                    "Repository safety warning",
                    message);
            }

            project.LastUnsafeAlertCommitSha = signature;
            await _projectRepository.UpdateAsync(project);
            await CurrentUnitOfWork.SaveChangesAsync();
            return;
        }

        if (!string.IsNullOrWhiteSpace(project.LastUnsafeAlertCommitSha))
        {
            project.LastUnsafeAlertCommitSha = string.Empty;
            await _projectRepository.UpdateAsync(project);
            await CurrentUnitOfWork.SaveChangesAsync();
        }
    }

    private static string NormalizeDifficultyLabel(string input)
    {
        var normalized = (input ?? string.Empty).Trim().ToLowerInvariant();
        return normalized is "beginner" or "intermediate" or "advanced" or "expert"
            ? normalized
            : "intermediate";
    }
}
