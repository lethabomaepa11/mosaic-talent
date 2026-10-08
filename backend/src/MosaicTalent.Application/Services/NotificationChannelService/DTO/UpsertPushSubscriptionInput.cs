using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.NotificationChannelService.DTO;

public class UpsertPushSubscriptionInput
{
    [Required]
    [MaxLength(2048)]
    public string Endpoint { get; set; }

    [Required]
    [MaxLength(512)]
    public string P256DH { get; set; }

    [Required]
    [MaxLength(512)]
    public string Auth { get; set; }

    [MaxLength(256)]
    public string DeviceName { get; set; }

    [MaxLength(512)]
    public string UserAgent { get; set; }
}
