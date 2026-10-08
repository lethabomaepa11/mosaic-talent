using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.NotificationChannelService.DTO;

public class MarkNotificationAsReadInput
{
    [Required]
    public Guid NotificationId { get; set; }
}
