using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.NotificationChannelService.DTO;

public class RemovePushSubscriptionInput
{
    [Required]
    [MaxLength(2048)]
    public string Endpoint { get; set; }
}
