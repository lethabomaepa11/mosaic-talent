using Abp.Authorization;
using Abp.Domain.Uow;
using Microsoft.AspNetCore.SignalR;
using MosaicTalent.Services.AiService;
using MosaicTalent.Services.SimulationScenarioService;
using MosaicTalent.Services.SimulationScenarioService.DTO;
using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace MosaicTalent.Web.Host.Hubs
{
    [AbpAuthorize]
    public class SimulationVoiceHub : Hub
    {
        private static readonly ConcurrentDictionary<string, long> ConnectionVersions = new ConcurrentDictionary<string, long>();

        private readonly ISimulationScenarioAppService _simulationScenarioAppService;
        private readonly IDeepgramVoiceService _deepgramVoiceService;
        private readonly IUnitOfWorkManager _unitOfWorkManager;

        public SimulationVoiceHub(
            ISimulationScenarioAppService simulationScenarioAppService,
            IDeepgramVoiceService deepgramVoiceService,
            IUnitOfWorkManager unitOfWorkManager)
        {
            _simulationScenarioAppService = simulationScenarioAppService;
            _deepgramVoiceService = deepgramVoiceService;
            _unitOfWorkManager = unitOfWorkManager;
        }

        public Task JoinSession(string sessionId)
        {
            return Groups.AddToGroupAsync(Context.ConnectionId, BuildSessionGroup(sessionId));
        }

        public Task Interrupt()
        {
            ConnectionVersions.AddOrUpdate(Context.ConnectionId, 1, (_, current) => current + 1);
            return Clients.Caller.SendAsync("simulation_interrupt_ack");
        }

        public async Task SendUserMessage(string sessionId, string content)
        {
            if (!Guid.TryParse(sessionId, out var parsedSessionId) || string.IsNullOrWhiteSpace(content))
            {
                await Clients.Caller.SendAsync("simulation_error", "Invalid session or empty content.");
                return;
            }

            var version = ConnectionVersions.AddOrUpdate(Context.ConnectionId, 1, (_, current) => current + 1);
            await Clients.Caller.SendAsync("simulation_turn_started", new { sessionId, version });
            await ProcessTurnAsync(parsedSessionId, content.Trim(), version, Context.ConnectionId, sessionId);
        }

        private async Task ProcessTurnAsync(Guid sessionId, string content, long version, string connectionId, string sessionIdText)
        {
            try
            {
                SimulationSessionDto session;
                using (var uow = _unitOfWorkManager.Begin())
                {
                    session = await _simulationScenarioAppService.SendMessage(new SendScenarioMessageInput
                    {
                        SessionId = sessionId,
                        Content = content,
                    });
                    await uow.CompleteAsync();
                }

                if (!IsLatest(connectionId, version))
                {
                    return;
                }

                await Clients.Caller.SendAsync("simulation_session_updated", new { sessionId = sessionIdText, session, version });

                var latestBotReply = FindLatestBotReply(session);
                if (latestBotReply == null)
                {
                    await Clients.Caller.SendAsync("simulation_turn_completed", new { sessionId = sessionIdText, version });
                    return;
                }

                var voiceModel = ResolveVoiceModelForRole(latestBotReply.Role);
                await Clients.Caller.SendAsync("simulation_bot_text", new
                {
                    sessionId = sessionIdText,
                    version,
                    role = latestBotReply.Role,
                    messageId = latestBotReply.Id.ToString(),
                    text = latestBotReply.Content,
                    voiceModel,
                });

                var audioResult = await _deepgramVoiceService.TrySynthesizeAsync(latestBotReply.Content, voiceModel);
                if (IsLatest(connectionId, version) && audioResult.AudioBytes != null && audioResult.AudioBytes.Length > 0)
                {
                    await Clients.Caller.SendAsync("simulation_bot_audio", new
                    {
                        sessionId = sessionIdText,
                        version,
                        role = latestBotReply.Role,
                        messageId = latestBotReply.Id.ToString(),
                        voiceModel,
                        audioBase64 = Convert.ToBase64String(audioResult.AudioBytes),
                        audioMimeType = audioResult.MimeType ?? "audio/mpeg",
                    });
                }

                if (IsLatest(connectionId, version))
                {
                    await Clients.Caller.SendAsync("simulation_turn_completed", new { sessionId = sessionIdText, version });
                }
            }
            catch (Exception ex)
            {
                if (IsLatest(connectionId, version))
                {
                    await Clients.Caller.SendAsync("simulation_error", ex.Message);
                }
            }
        }

        private static string ResolveVoiceModelForRole(string role)
        {
            var normalizedRole = (role ?? string.Empty).Trim().ToLowerInvariant();
            if (normalizedRole.Contains("facilitator")) return "aura-2-orion-en";
            if (normalizedRole.Contains("stakeholder")) return "aura-2-athena-en";
            if (normalizedRole.Contains("member") || normalizedRole.Contains("teammate")) return "aura-2-angus-en";
            if (normalizedRole.Contains("assessor")) return "aura-2-helios-en";
            if (normalizedRole.Contains("orchestrator")) return "aura-2-zeus-en";
            return "aura-2-thalia-en";
        }

        private static ScenarioMessageDto FindLatestBotReply(SimulationSessionDto session)
        {
            var latestUserIndex = -1;
            for (var i = session.Messages.Count - 1; i >= 0; i--)
            {
                if (string.Equals(session.Messages[i].Role, "User", StringComparison.OrdinalIgnoreCase))
                {
                    latestUserIndex = i;
                    break;
                }
            }

            if (latestUserIndex >= 0)
            {
                for (var i = session.Messages.Count - 1; i > latestUserIndex; i--)
                {
                    if (!string.Equals(session.Messages[i].Role, "User", StringComparison.OrdinalIgnoreCase))
                    {
                        return session.Messages[i];
                    }
                }
            }

            for (var i = session.Messages.Count - 1; i >= 0; i--)
            {
                if (!string.Equals(session.Messages[i].Role, "User", StringComparison.OrdinalIgnoreCase))
                {
                    return session.Messages[i];
                }
            }

            return null;
        }

        private static string BuildSessionGroup(string sessionId)
        {
            return $"simulation-session:{sessionId}";
        }

        private static bool IsLatest(string connectionId, long version)
        {
            return ConnectionVersions.TryGetValue(connectionId, out var current) && current == version;
        }
    }
}
