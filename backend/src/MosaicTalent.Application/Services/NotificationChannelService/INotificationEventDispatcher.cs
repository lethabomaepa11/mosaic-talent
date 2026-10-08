using Abp.Notifications;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MosaicTalent.Services.NotificationChannelService;

public interface INotificationEventDispatcher
{
    Task NotifyUsersAsync(
        int tenantId,
        IEnumerable<long> userIds,
        string notificationName,
        string message,
        NotificationSeverity severity = NotificationSeverity.Info,
        string url = "",
        string pushTitle = "",
        string pushBody = "");
}
