using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.CompanyJobService.DTO;

public class SendApplicationEmailInput
{
    [Required]
    public Guid JobApplicationId { get; set; }

    [Required]
    [MaxLength(240)]
    public string Subject { get; set; }

    [Required]
    [MaxLength(12000)]
    public string Message { get; set; }
}
