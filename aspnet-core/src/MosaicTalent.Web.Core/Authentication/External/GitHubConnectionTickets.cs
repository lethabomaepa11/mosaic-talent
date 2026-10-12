using Abp.Dependency;
using Microsoft.AspNetCore.DataProtection;
using System;
using System.Text.Json;

namespace MosaicTalent.Authentication.External
{
    public class GitHubConnectionTicket
    {
        public long UserId { get; set; }
        public int? TenantId { get; set; }
        public string ReturnPath { get; set; }
        public long ExpiresAt { get; set; }
    }

    public class GitHubConnectionTickets : ITransientDependency
    {
        private readonly IDataProtector _protector;

        public GitHubConnectionTickets(IDataProtectionProvider provider)
        {
            _protector = provider.CreateProtector("MosaicTalent.GitHubConnection.v1");
        }

        public string Issue(long userId, int? tenantId, string returnPath)
        {
            return _protector.Protect(JsonSerializer.Serialize(new GitHubConnectionTicket
            {
                UserId = userId,
                TenantId = tenantId,
                ReturnPath = SafeReturnPath(returnPath),
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10).ToUnixTimeSeconds(),
            }));
        }

        public GitHubConnectionTicket Read(string state)
        {
            try
            {
                var ticket = JsonSerializer.Deserialize<GitHubConnectionTicket>(_protector.Unprotect(state));
                if (ticket == null || ticket.UserId <= 0 || ticket.ExpiresAt <= DateTimeOffset.UtcNow.ToUnixTimeSeconds()) return null;
                ticket.ReturnPath = SafeReturnPath(ticket.ReturnPath);
                return ticket;
            }
            catch (System.Security.Cryptography.CryptographicException) { return null; }
            catch (JsonException) { return null; }
            catch (ArgumentException) { return null; }
        }

        public static string SafeReturnPath(string path)
        {
            return path == "/app/projects/create" || path == "/app/profile" || path == "/onboarding"
                ? path : "/onboarding";
        }
    }
}
