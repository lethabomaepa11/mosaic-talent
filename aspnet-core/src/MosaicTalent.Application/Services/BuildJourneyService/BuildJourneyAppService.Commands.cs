using Abp.Timing;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Services.BuildJourneyService.DTO;
using MosaicTalent.Services.DeveloperProjectService.DTO;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MosaicTalent.Services.BuildJourneyService;

public partial class BuildJourneyAppService
{
    public async Task<BuildProjectDto> CreateBuild(CreateBuildInput input)
    {
        if (input == null || !Enum.IsDefined(input.Purpose)) throw new UserFriendlyException("Choose a reason for this build.");
        var created = await _projectService.CreateProject(input);
        var project = await _projects.GetAsync(created.Id);
        project.Purpose = input.Purpose;
        project.FirstOutcome = input.FirstOutcome?.Trim();
        project.TeamTimeZone = input.TeamTimeZone?.Trim();
        await CurrentUnitOfWork.SaveChangesAsync();
        if (input.CreateStarterTask && !string.IsNullOrWhiteSpace(project.FirstOutcome))
        {
            await CreateTask(new CreateBuildTaskInput
            {
                ProjectId = project.Id, Title = project.FirstOutcome.Length > 160 ? project.FirstOutcome[..160] : project.FirstOutcome,
                Description = "Deliver the first milestone agreed in the project brief.",
                AcceptanceCriteria = project.FirstOutcome, IsStarterTask = true
            });
        }
        return await GetBuild(new GetDeveloperProjectInput { ProjectId = project.Id });
    }

    public async Task<BuildProjectDto> CreateTask(CreateBuildTaskInput input)
    {
        var developer = await CurrentDeveloper();
        await EnsureActiveMember(input.ProjectId, developer.Id);
        var created = await _projectService.AddProjectTask(input);
        var task = await _tasks.GetAsync(Guid.Parse(created.Id));
        task.AcceptanceCriteria = input.AcceptanceCriteria?.Trim();
        task.IsStarterTask = input.IsStarterTask;
        await CurrentUnitOfWork.SaveChangesAsync();
        return await GetBuild(new GetDeveloperProjectInput { ProjectId = input.ProjectId });
    }

    public async Task<BuildProjectDto> ClaimTask(ClaimBuildTaskInput input)
    {
        if (input == null || input.TaskId == Guid.Empty) throw new UserFriendlyException("Choose a task first.");
        var developer = await CurrentDeveloper();
        await EnsureActiveMember(input.ProjectId, developer.Id);
        var now = Clock.Now;
        // A conditional database write prevents two team members claiming the same task.
        var claimed = await _tasks.GetAll()
            .Where(x => x.Id == input.TaskId && x.ProjectId == input.ProjectId && x.AssignedDeveloperId == null && x.Status != ProjectTaskStatus.Done)
            .ExecuteUpdateAsync(update => update
                .SetProperty(x => x.AssignedDeveloperId, (Guid?)developer.Id)
                .SetProperty(x => x.LastModifierUserId, AbpSession.UserId)
                .SetProperty(x => x.LastModificationTime, (DateTime?)now));
        if (claimed == 0)
        {
            var existing = await _tasks.GetAll().FirstOrDefaultAsync(x => x.Id == input.TaskId && x.ProjectId == input.ProjectId);
            if (existing?.AssignedDeveloperId != developer.Id)
                throw new UserFriendlyException("This task is no longer available. Choose another task or speak with your team.");
        }
        return await GetBuild(new GetDeveloperProjectInput { ProjectId = input.ProjectId });
    }

    public async Task<BuildProjectDto> SetTaskStatus(UpdateProjectTaskStatusInput input)
    {
        var developer = await CurrentDeveloper();
        var membership = await EnsureActiveMember(input.ProjectId, developer.Id);
        var task = await _tasks.GetAll().FirstOrDefaultAsync(x => x.Id == input.TaskId && x.ProjectId == input.ProjectId)
            ?? throw new UserFriendlyException("Task not found.");
        var project = await _projects.GetAsync(input.ProjectId);
        if (task.AssignedDeveloperId != developer.Id && membership.Role != MemberRole.Lead && project.OwnerDeveloperId != developer.Id)
            throw new UserFriendlyException("Pick up this task before changing its status.");
        await _projectService.UpdateProjectTaskStatus(input);
        return await GetBuild(new GetDeveloperProjectInput { ProjectId = input.ProjectId });
    }

    private async Task<ProjectMember> EnsureActiveMember(Guid projectId, Guid developerId)
    {
        var project = await _projects.FirstOrDefaultAsync(projectId)
            ?? throw new UserFriendlyException("Project not found.");
        if (project.Status == ProjectStatus.Complete) throw new UserFriendlyException("This build is complete. Its work can still be viewed.");
        return await _members.GetAll().FirstOrDefaultAsync(x => x.ProjectId == projectId && x.DeveloperId == developerId)
            ?? throw new UserFriendlyException("Join this team before changing its work.");
    }
}
