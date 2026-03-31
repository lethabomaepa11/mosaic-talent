using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Notifications;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MosaicTalent.Domains.Notifications;
using MosaicTalent.Services.NotificationChannelService.DTO;
using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace MosaicTalent.Services.NotificationChannelService;

[AbpAuthorize]
public class NotificationChannelAppService : MosaicTalentAppServiceBase, INotificationChannelAppService
{
    private readonly IRepository<UserNotificationInfo, Guid> _userNotificationRepository;
    private readonly IRepository<TenantNotificationInfo, Guid> _tenantNotificationRepository;
    private readonly IRepository<PushSubscription, Guid> _pushSubscriptionRepository;
    private readonly IConfiguration _configuration;

    public NotificationChannelAppService(
        IRepository<UserNotificationInfo, Guid> userNotificationRepository,
        IRepository<TenantNotificationInfo, Guid> tenantNotificationRepository,
        IRepository<PushSubscription, Guid> pushSubscriptionRepository,
        IConfiguration configuration)
    {
        _userNotificationRepository = userNotificationRepository;
        _tenantNotificationRepository = tenantNotificationRepository;
        _pushSubscriptionRepository = pushSubscriptionRepository;
        _configuration = configuration;
    }

    public async Task<NotificationFeedDto> GetMyNotifications(GetMyNotificationsInput input)
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var safeInput = input ?? new GetMyNotificationsInput();
        var skipCount = Math.Max(safeInput.SkipCount, 0);
        var maxResultCount = Math.Clamp(safeInput.MaxResultCount, 1, 100);

        var query =
            from userNotification in _userNotificationRepository.GetAll()
            join tenantNotification in _tenantNotificationRepository.GetAll()
                on userNotification.TenantNotificationId equals tenantNotification.Id
            where userNotification.TenantId == tenantId && userNotification.UserId == userId
            select new
            {
                UserNotification = userNotification,
                TenantNotification = tenantNotification,
            };

        if (safeInput.UnreadOnly)
        {
            query = query.Where(x => x.UserNotification.State == UserNotificationState.Unread);
        }

        var totalCount = await query.CountAsync();
        var unreadCount = await _userNotificationRepository.GetAll()
            .Where(x => x.TenantId == tenantId && x.UserId == userId && x.State == UserNotificationState.Unread)
            .CountAsync();

        var rows = await query
            .OrderByDescending(x => x.UserNotification.CreationTime)
            .Skip(skipCount)
            .Take(maxResultCount)
            .ToListAsync();

        return new NotificationFeedDto
        {
            TotalCount = totalCount,
            UnreadCount = unreadCount,
            Items = rows.Select(row => new NotificationItemDto
            {
                Id = row.UserNotification.Id,
                NotificationName = row.TenantNotification.NotificationName,
                Message = ResolveMessage(row.TenantNotification.Data, row.TenantNotification.NotificationName),
                Severity = row.TenantNotification.Severity.ToString().ToLowerInvariant(),
                IsRead = row.UserNotification.State == UserNotificationState.Read,
                CreationTime = row.UserNotification.CreationTime,
                Data = row.TenantNotification.Data,
            }).ToList(),
        };
    }

    public async Task MarkNotificationAsRead(MarkNotificationAsReadInput input)
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var notification = await _userNotificationRepository.GetAll()
            .FirstOrDefaultAsync(x =>
                x.TenantId == tenantId &&
                x.UserId == userId &&
                x.Id == input.NotificationId);

        if (notification == null)
        {
            throw new UserFriendlyException("Notification was not found.");
        }

        if (notification.State != UserNotificationState.Read)
        {
            notification.State = UserNotificationState.Read;
            await _userNotificationRepository.UpdateAsync(notification);
            await CurrentUnitOfWork.SaveChangesAsync();
        }
    }

    public async Task MarkAllNotificationsAsRead()
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var unread = await _userNotificationRepository.GetAll()
            .Where(x =>
                x.TenantId == tenantId &&
                x.UserId == userId &&
                x.State == UserNotificationState.Unread)
            .ToListAsync();

        if (unread.Count == 0)
        {
            return;
        }

        foreach (var entry in unread)
        {
            entry.State = UserNotificationState.Read;
            await _userNotificationRepository.UpdateAsync(entry);
        }

        await CurrentUnitOfWork.SaveChangesAsync();
    }

    public async Task<PushPreferencesDto> GetPushPreferences()
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var vapidPublicKey = GetVapidPublicKey();
        var isConfigured = IsPushConfigured();
        var isSubscribed = await _pushSubscriptionRepository.GetAll()
            .AnyAsync(x => x.TenantId == tenantId && x.UserId == userId && x.IsActive);

        return new PushPreferencesDto
        {
            IsConfigured = isConfigured,
            IsSubscribed = isSubscribed,
            VapidPublicKey = vapidPublicKey,
        };
    }

    public async Task<PushPreferencesDto> UpsertPushSubscription(UpsertPushSubscriptionInput input)
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");

        if (!IsPushConfigured())
        {
            throw new UserFriendlyException("Push notifications are not configured.");
        }

        var endpoint = input.Endpoint?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(endpoint))
        {
            throw new UserFriendlyException("Endpoint is required.");
        }

        var existing = await _pushSubscriptionRepository.GetAll()
            .FirstOrDefaultAsync(x =>
                x.TenantId == tenantId &&
                x.UserId == userId &&
                x.Endpoint == endpoint);

        var now = DateTime.UtcNow;
        if (existing == null)
        {
            await _pushSubscriptionRepository.InsertAsync(new PushSubscription
            {
                TenantId = tenantId,
                UserId = userId,
                Endpoint = endpoint,
                P256DH = (input.P256DH ?? string.Empty).Trim(),
                Auth = (input.Auth ?? string.Empty).Trim(),
                DeviceName = (input.DeviceName ?? string.Empty).Trim(),
                UserAgent = (input.UserAgent ?? string.Empty).Trim(),
                IsActive = true,
                LastSeenAt = now,
            });
        }
        else
        {
            existing.P256DH = (input.P256DH ?? string.Empty).Trim();
            existing.Auth = (input.Auth ?? string.Empty).Trim();
            existing.DeviceName = (input.DeviceName ?? string.Empty).Trim();
            existing.UserAgent = (input.UserAgent ?? string.Empty).Trim();
            existing.IsActive = true;
            existing.LastSeenAt = now;
            await _pushSubscriptionRepository.UpdateAsync(existing);
        }

        await CurrentUnitOfWork.SaveChangesAsync();
        return await GetPushPreferences();
    }

    public async Task<PushPreferencesDto> RemovePushSubscription(RemovePushSubscriptionInput input)
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var endpoint = input.Endpoint?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(endpoint))
        {
            throw new UserFriendlyException("Endpoint is required.");
        }

        var existing = await _pushSubscriptionRepository.GetAll()
            .FirstOrDefaultAsync(x =>
                x.TenantId == tenantId &&
                x.UserId == userId &&
                x.Endpoint == endpoint);

        if (existing != null && existing.IsActive)
        {
            existing.IsActive = false;
            existing.LastSeenAt = DateTime.UtcNow;
            await _pushSubscriptionRepository.UpdateAsync(existing);
            await CurrentUnitOfWork.SaveChangesAsync();
        }

        return await GetPushPreferences();
    }

    private bool IsPushConfigured()
    {
        var publicKey = GetVapidPublicKey();
        var privateKey = (_configuration["WebPush:PrivateKey"] ?? _configuration["WebPush__PrivateKey"] ?? string.Empty).Trim();
        var subject = (_configuration["WebPush:Subject"] ?? _configuration["WebPush__Subject"] ?? string.Empty).Trim();
        return !string.IsNullOrWhiteSpace(publicKey) &&
               !string.IsNullOrWhiteSpace(privateKey) &&
               !string.IsNullOrWhiteSpace(subject);
    }

    private string GetVapidPublicKey()
    {
        return (_configuration["WebPush:PublicKey"] ?? _configuration["WebPush__PublicKey"] ?? string.Empty).Trim();
    }

    private static string ResolveMessage(string jsonData, string fallback)
    {
        if (string.IsNullOrWhiteSpace(jsonData))
        {
            return fallback;
        }

        try
        {
            using var doc = JsonDocument.Parse(jsonData);
            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
            {
                return fallback;
            }

            if (TryReadString(root, "message", out var message))
            {
                return message;
            }

            if (TryReadString(root, "Message", out message))
            {
                return message;
            }

            if (root.TryGetProperty("properties", out var properties) &&
                properties.ValueKind == JsonValueKind.Object &&
                TryReadString(properties, "Message", out message))
            {
                return message;
            }
        }
        catch
        {
            // ignored - fallback text is used instead
        }

        return fallback;
    }

    private static bool TryReadString(JsonElement element, string key, out string value)
    {
        value = string.Empty;
        if (!element.TryGetProperty(key, out var property) || property.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        value = property.GetString() ?? string.Empty;
        return !string.IsNullOrWhiteSpace(value);
    }
}
