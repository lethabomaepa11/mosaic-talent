using Abp.Authorization;
using MosaicTalent.Services.AiService;
using MosaicTalent.Services.SimulationScenarioService;
using MosaicTalent.Services.SimulationScenarioService.DTO;
using MosaicTalent.Services.SimulationVoiceService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MosaicTalent.Services.SimulationVoiceService;

[AbpAuthorize]
public class SimulationVoiceAppService : MosaicTalentAppServiceBase, ISimulationVoiceAppService
{
    private readonly ISimulationScenarioAppService _simulationScenarioAppService;
    private readonly IDeepgramVoiceService _deepgramVoiceService;

    public SimulationVoiceAppService(
        ISimulationScenarioAppService simulationScenarioAppService,
        IDeepgramVoiceService deepgramVoiceService)
    {
        _simulationScenarioAppService = simulationScenarioAppService;
        _deepgramVoiceService = deepgramVoiceService;
    }

    public Task<List<SimulationVoiceModelDto>> GetVoiceModels()
    {
        var voices = _deepgramVoiceService.GetAvailableVoiceModels()
            .Select(model => new SimulationVoiceModelDto { Model = model })
            .ToList();
        return Task.FromResult(voices);
    }

    public async Task<SimulationVoiceTurnDto> Turn(SimulationVoiceTurnInput input)
    {
        var session = await _simulationScenarioAppService.SendMessage(new SendScenarioMessageInput
        {
            SessionId = input.SessionId,
            Content = input.Content?.Trim() ?? string.Empty,
        });

        var latestUserIndex = -1;
        for (var i = session.Messages.Count - 1; i >= 0; i--)
        {
            if (string.Equals(session.Messages[i].Role, "User", StringComparison.OrdinalIgnoreCase))
            {
                latestUserIndex = i;
                break;
            }
        }

        ScenarioMessageDto latestBotReply = null;
        if (latestUserIndex >= 0)
        {
            for (var i = session.Messages.Count - 1; i > latestUserIndex; i--)
            {
                if (!string.Equals(session.Messages[i].Role, "User", StringComparison.OrdinalIgnoreCase))
                {
                    latestBotReply = session.Messages[i];
                    break;
                }
            }
        }

        if (latestBotReply == null)
        {
            for (var i = session.Messages.Count - 1; i >= 0; i--)
            {
                if (!string.Equals(session.Messages[i].Role, "User", StringComparison.OrdinalIgnoreCase))
                {
                    latestBotReply = session.Messages[i];
                    break;
                }
            }
        }

        if (latestBotReply == null)
        {
            return new SimulationVoiceTurnDto
            {
                Session = session,
                ReplyText = string.Empty,
                ReplyRole = string.Empty,
                ReplyMessageId = string.Empty,
                VoiceModel = string.Empty,
                AudioBase64 = null,
                AudioMimeType = null,
            };
        }

        var selectedVoiceModel = ResolveVoiceModelForRole(latestBotReply.Role);
        var audioResult = await _deepgramVoiceService.TrySynthesizeAsync(latestBotReply.Content, selectedVoiceModel);
        var audioBytes = audioResult.AudioBytes;
        var mimeType = audioResult.MimeType;
        var audioBase64 = audioBytes == null || audioBytes.Length == 0
            ? null
            : Convert.ToBase64String(audioBytes);

        return new SimulationVoiceTurnDto
        {
            Session = session,
            ReplyText = latestBotReply.Content,
            ReplyRole = latestBotReply.Role,
            ReplyMessageId = latestBotReply.Id.ToString(),
            VoiceModel = selectedVoiceModel ?? string.Empty,
            AudioBase64 = audioBase64,
            AudioMimeType = audioBase64 == null ? null : (mimeType ?? "audio/mpeg"),
        };
    }

    private static string ResolveVoiceModelForRole(string role)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            return null;
        }

        var normalizedRole = role.Trim().ToLowerInvariant();
        if (normalizedRole.Contains("facilitator"))
        {
            return "aura-2-orion-en";
        }
        if (normalizedRole.Contains("stakeholder"))
        {
            return "aura-2-athena-en";
        }
        if (normalizedRole.Contains("member") || normalizedRole.Contains("teammate"))
        {
            return "aura-2-angus-en";
        }
        if (normalizedRole.Contains("assessor"))
        {
            return "aura-2-helios-en";
        }
        if (normalizedRole.Contains("orchestrator"))
        {
            return "aura-2-zeus-en";
        }

        return "aura-2-thalia-en";
    }
}
