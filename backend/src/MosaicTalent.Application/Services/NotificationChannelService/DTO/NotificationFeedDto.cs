using System.Collections.Generic;

namespace MosaicTalent.Services.NotificationChannelService.DTO;

public class NotificationFeedDto
{
    public List<NotificationItemDto> Items { get; set; } = new();

    public int TotalCount { get; set; }

    public int UnreadCount { get; set; }
}
