using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.NotificationChannelService.DTO;

public class GetMyNotificationsInput
{
    [Range(0, int.MaxValue)]
    public int SkipCount { get; set; } = 0;

    [Range(1, 100)]
    public int MaxResultCount { get; set; } = 20;

    public bool UnreadOnly { get; set; } = false;
}
