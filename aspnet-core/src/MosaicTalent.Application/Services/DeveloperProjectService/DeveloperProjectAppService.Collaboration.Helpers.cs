using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.DeveloperProjectService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperProjectService;

public partial class DeveloperProjectAppService
{
    private async Task<ProjectJoinLoadWarningDto> BuildJoinLoadWarning(Guid developerId, Project candidateProject)
    {
        var memberships = await _projectMemberRepository.GetAll()
            .Where(x => x.DeveloperId == developerId)
            .ToListAsync();
        if (memberships.Count == 0)
        {
            var emptyScore = CalculateProjectWorkloadScore(candidateProject);
            return new ProjectJoinLoadWarningDto
            {
                ShouldWarn = emptyScore > RecommendedWorkloadScoreLimit,
                ActiveProjects = 0,
                RecommendedProjectLimit = RecommendedActiveProjectLimit,
                CurrentWorkloadScore = 0,
                ProposedWorkloadScore = emptyScore,
                RecommendedWorkloadLimit = RecommendedWorkloadScoreLimit,
                Message = "No active project overlap detected.",
            };
        }

        var projectIds = memberships.Select(x => x.ProjectId).Distinct().ToList();
        var activeProjects = await _projectRepository.GetAll()
            .Where(x => projectIds.Contains(x.Id) && x.Status != ProjectStatus.Complete)
            .ToListAsync();
        var activeCount = activeProjects.Count;
        var currentWorkload = activeProjects.Sum(CalculateProjectWorkloadScore);

        var alreadyActive = activeProjects.Any(x => x.Id == candidateProject.Id);
        var proposedCount = alreadyActive ? activeCount : activeCount + 1;
        var proposedWorkload = alreadyActive
            ? currentWorkload
            : currentWorkload + CalculateProjectWorkloadScore(candidateProject);

        var shouldWarn = proposedCount > RecommendedActiveProjectLimit ||
                         proposedWorkload > RecommendedWorkloadScoreLimit;
        return new ProjectJoinLoadWarningDto
        {
            ShouldWarn = shouldWarn,
            ActiveProjects = activeCount,
            RecommendedProjectLimit = RecommendedActiveProjectLimit,
            CurrentWorkloadScore = currentWorkload,
            ProposedWorkloadScore = proposedWorkload,
            RecommendedWorkloadLimit = RecommendedWorkloadScoreLimit,
            Message = shouldWarn
                ? $"You are about to run {proposedCount} active projects with workload score {proposedWorkload}. This may affect learning quality due to overlapping timelines."
                : "No active project overlap detected.",
        };
    }

    private async Task<Dictionary<Guid, List<string>>> BuildMemberSkillMap(List<Guid> memberIds)
    {
        var profiles = await _developerProfileRepository.GetAll()
            .Where(x => memberIds.Contains(x.DeveloperId))
            .ToListAsync();
        var profileIds = profiles.Select(x => x.Id).ToList();
        var profileSkills = await _developerProfileSkillRepository.GetAll()
            .Where(x => profileIds.Contains(x.ProfileId))
            .ToListAsync();

        var map = new Dictionary<Guid, List<string>>();
        foreach (var memberId in memberIds)
        {
            var profile = profiles.FirstOrDefault(x => x.DeveloperId == memberId);
            var skills = profile == null
                ? new List<string>()
                : profileSkills
                    .Where(x => x.ProfileId == profile.Id)
                    .Select(x => x.Name)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
            map[memberId] = skills;
        }

        return map;
    }

    private async Task<string> ResolveDeveloperDisplayName(Guid developerId)
    {
        var developer = await _developerRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == developerId);
        if (developer == null)
        {
            return string.Empty;
        }

        var user = await _userRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == developer.UserId);
        var fullName = string.Join(" ", new[] { user?.Name, user?.Surname }
            .Where(x => !string.IsNullOrWhiteSpace(x)));
        return string.IsNullOrWhiteSpace(fullName)
            ? user?.UserName ?? "Developer"
            : fullName;
    }

    private static int CalculateProjectWorkloadScore(Project project)
    {
        var hours = Math.Clamp(project?.EstimatedHoursPerWeek ?? 6, 1, 40);
        var difficultyMultiplier = project?.Difficulty switch
        {
            ProjectDifficulty.Beginner => 1.0,
            ProjectDifficulty.Intermediate => 1.35,
            ProjectDifficulty.Advanced => 1.75,
            ProjectDifficulty.Expert => 2.2,
            _ => 1.35,
        };

        return (int)Math.Round(hours * difficultyMultiplier * 10, MidpointRounding.AwayFromZero);
    }
}
