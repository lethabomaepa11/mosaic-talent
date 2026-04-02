using Abp;
using Abp.Domain.Repositories;
using Abp.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Notifications;
using MosaicTalent.Domains.Projects;
using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using WebPush;
using DomainPushSubscription = MosaicTalent.Domains.Notifications.PushSubscription;

namespace MosaicTalent.Services.NotificationChannelService;

public class ProjectJoinNotificationDispatcher : MosaicTalentAppServiceBase, IProjectJoinNotificationDispatcher
{
    private readonly IRepository<Developer, Guid> _developerRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly IRepository<DomainPushSubscription, Guid> _pushSubscriptionRepository;
    private readonly INotificationPublisher _notificationPublisher;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public ProjectJoinNotificationDispatcher(
        IRepository<Developer, Guid> developerRepository,
        IRepository<User, long> userRepository,
        IRepository<DomainPushSubscription, Guid> pushSubscriptionRepository,
        INotificationPublisher notificationPublisher,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _developerRepository = developerRepository;
        _userRepository = userRepository;
        _pushSubscriptionRepository = pushSubscriptionRepository;
        _notificationPublisher = notificationPublisher;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public async Task NotifyOwnerAboutJoinAsync(Project project, Developer joinedDeveloper, int tenantId)
    {
        if (project == null || joinedDeveloper == null)
        {
            return;
        }

        var ownerDeveloper = await _developerRepository.FirstOrDefaultAsync(project.OwnerDeveloperId);
        if (ownerDeveloper == null)
        {
            return;
        }

        var ownerUser = await _userRepository.FirstOrDefaultAsync(ownerDeveloper.UserId);
        if (ownerUser == null)
        {
            return;
        }

        var joinedUser = await _userRepository.FirstOrDefaultAsync(joinedDeveloper.UserId);
        var joinedName = BuildDisplayName(joinedUser, "A new member");
        var ownerName = BuildDisplayName(ownerUser, ownerUser.UserName ?? "Project owner");
        var projectTitle = string.IsNullOrWhiteSpace(project.Title) ? "your project" : project.Title.Trim();
        var message = $"{joinedName} joined \"{projectTitle}\".";
        var projectUrl = BuildProjectUrl(project.Id);
        var absoluteProjectUrl = BuildAbsoluteProjectUrl(project.Id);

        await PublishInAppNotificationAsync(tenantId, ownerUser.Id, message, projectUrl);
        await SendOwnerEmailAsync(ownerUser, ownerName, joinedName, projectTitle, absoluteProjectUrl);
        await SendOwnerPushAsync(tenantId, ownerUser.Id, joinedName, projectTitle, projectUrl);
    }

    public async Task NotifyDeveloperAboutInviteAsync(
        Project project,
        Developer invitedDeveloper,
        Developer invitedByDeveloper,
        int tenantId)
    {
        if (project == null || invitedDeveloper == null || invitedByDeveloper == null)
        {
            return;
        }

        var invitedUser = await _userRepository.FirstOrDefaultAsync(invitedDeveloper.UserId);
        if (invitedUser == null)
        {
            return;
        }

        var inviterUser = await _userRepository.FirstOrDefaultAsync(invitedByDeveloper.UserId);
        var invitedName = BuildDisplayName(invitedUser, invitedUser.UserName ?? "Developer");
        var inviterName = BuildDisplayName(inviterUser, "A project lead");
        var projectTitle = string.IsNullOrWhiteSpace(project.Title) ? "a project" : project.Title.Trim();
        var message = $"You were invited to join \"{projectTitle}\" by {inviterName}.";
        var projectUrl = BuildProjectUrl(project.Id);
        var absoluteProjectUrl = BuildAbsoluteProjectUrl(project.Id);

        await PublishInviteInAppNotificationAsync(tenantId, invitedUser.Id, message, projectUrl);
        await SendInviteEmailAsync(invitedUser, invitedName, inviterName, projectTitle, absoluteProjectUrl);
        await SendInvitePushAsync(tenantId, invitedUser.Id, inviterName, projectTitle, projectUrl);
    }

    private async Task PublishInAppNotificationAsync(int tenantId, long ownerUserId, string message, string projectUrl)
    {
        try
        {
            var data = new MessageNotificationData(message);
            if (!string.IsNullOrWhiteSpace(projectUrl))
            {
                data["url"] = projectUrl;
            }

            await _notificationPublisher.PublishAsync(
                "MosaicTalent.ProjectMemberJoined",
                data,
                severity: NotificationSeverity.Info,
                userIds: new[] { new UserIdentifier(tenantId, ownerUserId) });
        }
        catch (Exception ex)
        {
            Logger.Warn("Failed to publish project join in-app notification.", ex);
        }
    }

    private async Task PublishInviteInAppNotificationAsync(int tenantId, long userId, string message, string projectUrl)
    {
        try
        {
            var data = new MessageNotificationData(message);
            if (!string.IsNullOrWhiteSpace(projectUrl))
            {
                data["url"] = projectUrl;
            }

            await _notificationPublisher.PublishAsync(
                "MosaicTalent.ProjectInviteReceived",
                data,
                severity: NotificationSeverity.Info,
                userIds: new[] { new UserIdentifier(tenantId, userId) });
        }
        catch (Exception ex)
        {
            Logger.Warn("Failed to publish project invite in-app notification.", ex);
        }
    }

    private async Task SendOwnerEmailAsync(
        User ownerUser,
        string ownerName,
        string joinedName,
        string projectTitle,
        string absoluteProjectUrl)
    {
        if (string.IsNullOrWhiteSpace(ownerUser?.EmailAddress))
        {
            return;
        }

        var recipient = ownerUser.EmailAddress.Trim();
        var subject = $"{joinedName} joined your project";
        var body =
            $"Hi {WebUtility.HtmlEncode(ownerName)},<br/><br/>" +
            $"{WebUtility.HtmlEncode(joinedName)} just joined <strong>{WebUtility.HtmlEncode(projectTitle)}</strong>.<br/><br/>" +
            $"Open project: <a href=\"{WebUtility.HtmlEncode(absoluteProjectUrl)}\">{WebUtility.HtmlEncode(absoluteProjectUrl)}</a><br/><br/>" +
            "MosaicTalent";

        try
        {
            await SendEmailWithBrevoAsync(recipient, ownerName, subject, body);
        }
        catch (Exception ex)
        {
            Logger.Warn("Failed to send project join email notification.", ex);
        }
    }

    private async Task SendOwnerPushAsync(
        int tenantId,
        long ownerUserId,
        string joinedName,
        string projectTitle,
        string projectUrl)
    {
        var publicKey = (_configuration["WebPush:PublicKey"] ?? _configuration["WebPush__PublicKey"] ?? string.Empty).Trim();
        var privateKey = (_configuration["WebPush:PrivateKey"] ?? _configuration["WebPush__PrivateKey"] ?? string.Empty).Trim();
        var subject = (_configuration["WebPush:Subject"] ?? _configuration["WebPush__Subject"] ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(publicKey) || string.IsNullOrWhiteSpace(privateKey) || string.IsNullOrWhiteSpace(subject))
        {
            return;
        }

        var subscriptions = await _pushSubscriptionRepository.GetAll()
            .Where(x =>
                x.TenantId == tenantId &&
                x.UserId == ownerUserId &&
                x.IsActive)
            .ToListAsync();
        if (subscriptions.Count == 0)
        {
            return;
        }

        var payload = JsonSerializer.Serialize(new
        {
            title = "New project member",
            body = $"{joinedName} joined {projectTitle}.",
            url = projectUrl,
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
                Logger.Warn($"Failed to send web push for subscription {subscription.Id}.", ex);
            }
        }

        await CurrentUnitOfWork.SaveChangesAsync();
    }

    private async Task SendInviteEmailAsync(
        User invitedUser,
        string invitedName,
        string inviterName,
        string projectTitle,
        string absoluteProjectUrl)
    {
        if (string.IsNullOrWhiteSpace(invitedUser?.EmailAddress))
        {
            return;
        }

        var recipient = invitedUser.EmailAddress.Trim();
        var subject = $"You are invited to join {projectTitle}";
        var body =
            $"Hi {WebUtility.HtmlEncode(invitedName)},<br/><br/>" +
            $"{WebUtility.HtmlEncode(inviterName)} invited you to join <strong>{WebUtility.HtmlEncode(projectTitle)}</strong>.<br/><br/>" +
            $"Open project: <a href=\"{WebUtility.HtmlEncode(absoluteProjectUrl)}\">{WebUtility.HtmlEncode(absoluteProjectUrl)}</a><br/><br/>" +
            "MosaicTalent";

        try
        {
            await SendEmailWithBrevoAsync(recipient, invitedName, subject, body);
        }
        catch (Exception ex)
        {
            Logger.Warn("Failed to send project invite email notification.", ex);
        }
    }

    private async Task SendInvitePushAsync(
        int tenantId,
        long invitedUserId,
        string inviterName,
        string projectTitle,
        string projectUrl)
    {
        var publicKey = (_configuration["WebPush:PublicKey"] ?? _configuration["WebPush__PublicKey"] ?? string.Empty).Trim();
        var privateKey = (_configuration["WebPush:PrivateKey"] ?? _configuration["WebPush__PrivateKey"] ?? string.Empty).Trim();
        var subject = (_configuration["WebPush:Subject"] ?? _configuration["WebPush__Subject"] ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(publicKey) || string.IsNullOrWhiteSpace(privateKey) || string.IsNullOrWhiteSpace(subject))
        {
            return;
        }

        var subscriptions = await _pushSubscriptionRepository.GetAll()
            .Where(x =>
                x.TenantId == tenantId &&
                x.UserId == invitedUserId &&
                x.IsActive)
            .ToListAsync();
        if (subscriptions.Count == 0)
        {
            return;
        }

        var payload = JsonSerializer.Serialize(new
        {
            title = "Project invite",
            body = $"{inviterName} invited you to {projectTitle}.",
            url = projectUrl,
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
                Logger.Warn($"Failed to send project invite web push for subscription {subscription.Id}.", ex);
            }
        }

        await CurrentUnitOfWork.SaveChangesAsync();
    }

    private async Task SendEmailWithBrevoAsync(string toEmail, string toName, string subject, string html)
    {
        var apiKey = (_configuration["Brevo:ApiKey"] ?? _configuration["Brevo__ApiKey"] ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return;
        }

        var senderName = (_configuration["Brevo:SenderName"] ?? _configuration["Brevo__SenderName"] ?? "Mosaic Talent").Trim();
        var senderEmail = (_configuration["Brevo:SenderEmail"] ?? _configuration["Brevo__SenderEmail"] ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(senderEmail))
        {
            return;
        }

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Accept.Clear();
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        client.DefaultRequestHeaders.Add("api-key", apiKey);

        var payload = new
        {
            sender = new
            {
                name = senderName,
                email = senderEmail,
            },
            to = new[]
            {
                new
                {
                    email = toEmail,
                    name = string.IsNullOrWhiteSpace(toName) ? toEmail : toName,
                },
            },
            subject,
            htmlContent = html,
        };

        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json");
        using var response = await client.PostAsync("https://api.brevo.com/v3/smtp/email", content);
        if (!response.IsSuccessStatusCode)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            Logger.Warn($"Project join email delivery failed: {responseBody}");
        }
    }

    private string BuildProjectUrl(Guid projectId)
    {
        return $"/app/projects/{projectId}";
    }

    private string BuildAbsoluteProjectUrl(Guid projectId)
    {
        var root = (_configuration["App:ClientRootAddress"] ?? _configuration["App__ClientRootAddress"] ?? string.Empty)
            .Trim()
            .TrimEnd('/');
        var path = BuildProjectUrl(projectId);
        return string.IsNullOrWhiteSpace(root) ? path : $"{root}{path}";
    }

    private static string BuildDisplayName(User user, string fallback)
    {
        if (user == null)
        {
            return fallback;
        }

        var fullName = string.Join(" ", new[] { user.Name, user.Surname }.Where(x => !string.IsNullOrWhiteSpace(x))).Trim();
        if (!string.IsNullOrWhiteSpace(fullName))
        {
            return fullName;
        }

        if (!string.IsNullOrWhiteSpace(user.UserName))
        {
            return user.UserName;
        }

        return fallback;
    }
}
