using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.DeveloperProjectService.DTO;

public class SubmitProjectComplaintInput
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    [MaxLength(1500)]
    public string Complaint { get; set; }
}
