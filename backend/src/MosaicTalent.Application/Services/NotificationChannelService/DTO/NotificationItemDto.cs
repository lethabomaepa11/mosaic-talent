using System;

namespace MosaicTalent.Services.NotificationChannelService.DTO;

public class NotificationItemDto
{
    public Guid Id { get; set; }

    public string NotificationName { get; set; }

    public string Message { get; set; }

    public string Severity { get; set; }

    public bool IsRead { get; set; }

    public DateTime CreationTime { get; set; }

    public string Data { get; set; }
}
