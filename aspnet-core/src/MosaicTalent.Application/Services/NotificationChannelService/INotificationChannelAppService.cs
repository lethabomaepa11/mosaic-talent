using Abp.Application.Services;
using MosaicTalent.Services.NotificationChannelService.DTO;
using System.Threading.Tasks;

namespace MosaicTalent.Services.NotificationChannelService;

public interface INotificationChannelAppService : IApplicationService
{
    Task<NotificationFeedDto> GetMyNotifications(GetMyNotificationsInput input);

    Task MarkNotificationAsRead(MarkNotificationAsReadInput input);

    Task MarkAllNotificationsAsRead();

    Task<PushPreferencesDto> GetPushPreferences();

    Task<PushPreferencesDto> UpsertPushSubscription(UpsertPushSubscriptionInput input);

    Task<PushPreferencesDto> RemovePushSubscription(RemovePushSubscriptionInput input);
}
