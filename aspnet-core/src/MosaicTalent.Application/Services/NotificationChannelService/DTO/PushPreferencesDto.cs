namespace MosaicTalent.Services.NotificationChannelService.DTO;

public class PushPreferencesDto
{
    public bool IsConfigured { get; set; }

    public bool IsSubscribed { get; set; }

    public string VapidPublicKey { get; set; }
}
