using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class ProjectTeamInviteDto
{
    public string Id { get; set; }
    public string ProjectId { get; set; }
    public string DeveloperId { get; set; }
    public string DeveloperName { get; set; }
    public string DeveloperUserName { get; set; }
    public string InvitedByDeveloperId { get; set; }
    public string InvitedByDeveloperName { get; set; }
    public string Status { get; set; }
    public DateTime InvitedAtUtc { get; set; }
    public DateTime? RespondedAtUtc { get; set; }
}

public class AcceptProjectInviteInput
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    public Guid InviteId { get; set; }
}

public class RejectProjectInviteInput
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    public Guid InviteId { get; set; }

    [MaxLength(600)]
    public string Reason { get; set; }
}
