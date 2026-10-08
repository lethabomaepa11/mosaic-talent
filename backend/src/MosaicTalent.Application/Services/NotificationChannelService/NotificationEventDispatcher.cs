using Abp;
using Abp.Domain.Repositories;
using Abp.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MosaicTalent.Domains.Notifications;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using WebPush;
using DomainPushSubscription = MosaicTalent.Domains.Notifications.PushSubscription;

namespace MosaicTalent.Services.NotificationChannelService;

public class NotificationEventDispatcher : MosaicTalentAppServiceBase, INotificationEventDispatcher
{
    private readonly INotificationPublisher _notificationPublisher;
    private readonly IRepository<DomainPushSubscription, Guid> _pushSubscriptionRepository;
    private readonly IConfiguration _configuration;

    public NotificationEventDispatcher(
        INotificationPublisher notificationPublisher,
        IRepository<DomainPushSubscription, Guid> pushSubscriptionRepository,
        IConfiguration configuration)
    {
        _notificationPublisher = notificationPublisher;
        _pushSubscriptionRepository = pushSubscriptionRepository;
        _configuration = configuration;
    }

    public async Task NotifyUsersAsync(
        int tenantId,
        IEnumerable<long> userIds,
        string notificationName,
        string message,
        NotificationSeverity severity = NotificationSeverity.Info,
        string url = "",
        string pushTitle = "",
        string pushBody = "")
    {
        if (tenantId <= 0 || string.IsNullOrWhiteSpace(notificationName))
        {
            return;
        }

        var recipients = (userIds ?? Array.Empty<long>())
            .Where(x => x > 0)
            .Distinct()
            .ToList();
        if (recipients.Count == 0)
        {
            return;
        }

        var safeMessage = string.IsNullOrWhiteSpace(message)
            ? "You have a new notification."
            : message.Trim();
        var safeUrl = (url ?? string.Empty).Trim();
        var safePushTitle = string.IsNullOrWhiteSpace(pushTitle) ? "Mosaic Talent" : pushTitle.Trim();
        var safePushBody = string.IsNullOrWhiteSpace(pushBody) ? safeMessage : pushBody.Trim();

        try
        {
            var data = new MessageNotificationData(safeMessage);
            data["message"] = safeMessage;
            if (!string.IsNullOrWhiteSpace(safeUrl))
            {
                data["url"] = safeUrl;
            }

            await _notificationPublisher.PublishAsync(
                notificationName,
                data,
                severity: severity,
                userIds: recipients.Select(userId => new UserIdentifier(tenantId, userId)).ToArray());
        }
        catch (Exception ex)
        {
            Logger.Warn($"Failed to publish in-app notification '{notificationName}'.", ex);
        }

        await SendPushAsync(tenantId, recipients, safePushTitle, safePushBody, safeUrl);
    }

    private async Task SendPushAsync(int tenantId, List<long> userIds, string title, string body, string url)
    {
        if (!TryReadVapid(out var publicKey, out var privateKey, out var subject))
        {
            return;
        }

        var subscriptions = await _pushSubscriptionRepository.GetAll()
            .Where(x => x.TenantId == tenantId && userIds.Contains(x.UserId) && x.IsActive)
            .ToListAsync();
        if (subscriptions.Count == 0)
        {
            return;
        }

        var payload = JsonSerializer.Serialize(new
        {
            title,
            body,
            url = string.IsNullOrWhiteSpace(url) ? "/app" : url,
            icon = "/logo.svg",
            badge = "/logo.svg",
        });

        var client = new WebPushClient();
        var vapid = new VapidDetails(subject, publicKey, privateKey);
        foreach (var subscription in subscriptions)
        {
            try
            {
                var endpoint = new WebPush.PushSubscription(
                    subscription.Endpoint,
                    subscription.P256DH,
                    subscription.Auth);
                await client.SendNotificationAsync(endpoint, payload, vapid);
                subscription.LastSeenAt = DateTime.UtcNow;
                await _pushSubscriptionRepository.UpdateAsync(subscription);
            }
            catch (WebPushException ex) when (
                ex.StatusCode == HttpStatusCode.NotFound ||
                ex.StatusCode == HttpStatusCode.Gone)
            {
                subscription.IsActive = false;
                subscription.LastSeenAt = DateTime.UtcNow;
                await _pushSubscriptionRepository.UpdateAsync(subscription);
            }
            catch (Exception ex)
            {
                Logger.Warn($"Failed to send push notification to subscription {subscription.Id}.", ex);
            }
        }

        await CurrentUnitOfWork.SaveChangesAsync();
    }

    private bool TryReadVapid(out string publicKey, out string privateKey, out string subject)
    {
        publicKey = (_configuration["WebPush:PublicKey"] ?? _configuration["WebPush__PublicKey"] ?? string.Empty).Trim();
        privateKey = (_configuration["WebPush:PrivateKey"] ?? _configuration["WebPush__PrivateKey"] ?? string.Empty).Trim();
        subject = (_configuration["WebPush:Subject"] ?? _configuration["WebPush__Subject"] ?? string.Empty).Trim();

        return !string.IsNullOrWhiteSpace(publicKey) &&
               !string.IsNullOrWhiteSpace(privateKey) &&
               !string.IsNullOrWhiteSpace(subject);
    }
}
