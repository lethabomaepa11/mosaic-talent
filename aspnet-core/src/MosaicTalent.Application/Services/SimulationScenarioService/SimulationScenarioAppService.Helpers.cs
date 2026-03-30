using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Simulations;
using MosaicTalent.Services.SimulationScenarioService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Text.Json;
using System.Threading.Tasks;

namespace MosaicTalent.Services.SimulationScenarioService;

public partial class SimulationScenarioAppService
{
    private static readonly Regex PersonaRegex = new(
        @"(?<name>[A-Z][a-zA-Z]+)\s*(?:,?\s*(?:who|that)\s+is|is)\s+(?<traits>[^.!?\r\n]+)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly string[] ManagerKeywords =
    {
        "manager",
        "supervisor",
        "lead",
        "team lead",
    };

    private async Task<Developer> EnsureCurrentDeveloper()
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var developer = await _developerRepository.GetAll().FirstOrDefaultAsync(x => x.UserId == userId);
        return developer ?? throw new UserFriendlyException("Developer profile not found.");
    }

    private static BotRole ParseBotRole(string input)
    {
        return Enum.TryParse<BotRole>(input, true, out var role) ? role : BotRole.Teammate;
    }

    private static SessionType ParseSessionType(string input, int roleCount)
    {
        if (Enum.TryParse<SessionType>(input, true, out var explicitType))
        {
            return explicitType;
        }

        return roleCount >= 3 ? SessionType.MeetingSimulation : SessionType.OneOnOne;
    }

    private async Task<List<SimulationScenarioDto>> MapScenarios(List<SimulationScenario> scenarios)
    {
        var scenarioIds = scenarios.Select(x => x.Id).ToList();
        var requiredRoles = await _requiredRoleRepository.GetAll()
            .Where(x => scenarioIds.Contains(x.ScenarioId))
            .ToListAsync();

        return scenarios.Select(x => new SimulationScenarioDto
        {
            Id = x.Id,
            Title = x.Title,
            Prompt = x.Prompt,
            BotCount = x.BotCount,
            RequiredRoles = requiredRoles.Where(r => r.ScenarioId == x.Id).Select(r => r.Role.ToString()).ToList(),
        }).ToList();
    }

    private async Task<SimulationSessionDto> MapSession(SimulationSession session)
    {
        var scenario = await _scenarioRepository.FirstOrDefaultAsync(session.ScenarioId)
            ?? throw new UserFriendlyException("Simulation scenario not found.");
        var messages = await _messageRepository.GetAll()
            .Where(x => x.SessionId == session.Id)
            .OrderBy(x => x.CreationTime)
            .ToListAsync();
        var bots = await _botRepository.GetAll()
            .Where(x => x.SessionId == session.Id)
            .OrderBy(x => x.TurnOrder)
            .ToListAsync();
        var logs = await _orchestratorLogRepository.GetAll()
            .Where(x => x.SessionId == session.Id)
            .OrderByDescending(x => x.TurnIndex)
            .Take(15)
            .OrderBy(x => x.TurnIndex)
            .ToListAsync();
        var observations = await _observationRepository.GetAll()
            .Where(x => x.SessionId == session.Id)
            .OrderByDescending(x => x.TurnIndex)
            .Take(10)
            .OrderBy(x => x.TurnIndex)
            .ToListAsync();
        var observationIds = observations.Select(x => x.Id).ToList();
        var scores = await _dimensionScoreRepository.GetAll()
            .Where(x => observationIds.Contains(x.ObservationId))
            .ToListAsync();

        return new SimulationSessionDto
        {
            Id = session.Id,
            ScenarioId = session.ScenarioId,
            ScenarioTitle = scenario.Title,
            SessionType = session.SessionType.ToString(),
            OrchestratorNeeded = session.OrchestratorNeeded,
            AwaitingUserInput = session.SessionType == SessionType.OneOnOne || IsAwaitingUserInput(messages),
            Messages = messages.Select(x => new ScenarioMessageDto { Id = x.Id, Role = x.Role.ToString(), Content = x.Content, CreatedAt = x.CreationTime }).ToList(),
            Bots = bots.Select(x => new SimulationBotDto { Id = x.Id, Role = x.Role.ToString(), PersonalityPrompt = x.PersonalityPrompt, CurrentState = x.CurrentState, IsActive = x.IsActive, TurnOrder = x.TurnOrder }).ToList(),
            OrchestratorLogs = logs.Select(x => new OrchestratorLogDto { TurnIndex = x.TurnIndex, NextBotRole = x.NextBotRole.ToString(), CoherenceCheckPassed = x.CoherenceCheckPassed, CoherenceNotes = x.CoherenceNotes, Timestamp = x.Timestamp }).ToList(),
            Observations = observations.Select(x => new AssessorObservationDto
            {
                TurnIndex = x.TurnIndex,
                ObservationText = x.ObservationText,
                DimensionScores = scores.Where(s => s.ObservationId == x.Id).Select(s => new DimensionScoreDto { Dimension = s.Dimension.ToString(), Score = s.Score }).ToList(),
            }).ToList(),
        };
    }

    private static bool IsAwaitingUserInput(List<ScenarioMessage> orderedMessages)
    {
        if (orderedMessages.Count == 0)
        {
            return false;
        }

        var consecutiveBotMessages = 0;
        for (var index = orderedMessages.Count - 1; index >= 0; index--)
        {
            if (orderedMessages[index].Role == ScenarioRole.User)
            {
                break;
            }

            consecutiveBotMessages++;
        }

        return consecutiveBotMessages >= 1;
    }

    private static BotRole ResolveNextRole(List<SimulationBot> bots, int nonUserMessageCount)
    {
        var speakingBots = bots
            .Where(x => x.IsActive && x.Role != BotRole.Assessor && x.Role != BotRole.Orchestrator)
            .OrderBy(x => x.TurnOrder ?? int.MaxValue)
            .ToList();

        if (speakingBots.Count == 0)
        {
            return BotRole.Teammate;
        }

        var index = nonUserMessageCount % speakingBots.Count;
        return speakingBots[index].Role;
    }

    private async Task<string> GenerateBotReply(
        SimulationScenario scenario,
        SimulationBot bot,
        List<ScenarioMessage> recentMessages,
        string userMessage,
        string participantName)
    {
        var roleName = bot?.Role.ToString() ?? "Teammate";
        var safeParticipantName = string.IsNullOrWhiteSpace(participantName) ? "Participant" : participantName.Trim();
        var systemPrompt = $"You are acting as {roleName} in a teamwork simulation. Scenario: {scenario.Title}. Base prompt: {scenario.Prompt}. Personality contract: {bot?.PersonalityPrompt}. Always stay in-character and keep the same tone/attitude as that contract. Do not suddenly become supportive if the personality is difficult, dismissive, condescending or unclear. The participant is named {safeParticipantName}. Address them by this name when appropriate and never call them 'user'. Never impersonate the participant and never write a response that starts with '{safeParticipantName}:'. Speak only as {roleName}. Keep responses concise, realistic and professional.";
        var history = string.Join("\n", recentMessages.Select(x => $"{x.Role}: {x.Content}"));
        var userPrompt = JsonSerializer.Serialize(new
        {
            participantName = safeParticipantName,
            role = roleName,
            personality = bot?.PersonalityPrompt,
            latestUserMessage = userMessage,
            history,
            output = "Return JSON {\"content\":\"...\"}",
        });

        var completion = await _groqChatService.TryCompleteAsync(systemPrompt, userPrompt);
        if (!string.IsNullOrWhiteSpace(completion))
        {
            try
            {
                using var doc = JsonDocument.Parse(completion);
                if (doc.RootElement.TryGetProperty("content", out var contentElement))
                {
                    var parsed = contentElement.GetString();
                    if (!string.IsNullOrWhiteSpace(parsed))
                    {
                        return SanitizeBotReply(parsed, safeParticipantName, roleName);
                    }
                }
            }
            catch
            {
            }
        }

        return $"{roleName}: Thanks for sharing, {safeParticipantName}. Let's break this into a clear next step and align responsibilities before we proceed.";
    }

    private static string SanitizeBotReply(string reply, string participantName, string roleName)
    {
        var value = (reply ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(value))
        {
            return $"{roleName}: Let's align on the next practical step.";
        }

        var participantPrefix = $"{participantName}:";
        if (value.StartsWith(participantPrefix, StringComparison.OrdinalIgnoreCase))
        {
            value = value[participantPrefix.Length..].Trim();
        }

        if (value.StartsWith("User:", StringComparison.OrdinalIgnoreCase))
        {
            value = value["User:".Length..].Trim();
        }

        if (string.IsNullOrWhiteSpace(value))
        {
            return $"{roleName}: Let's align on the next practical step.";
        }

        return value;
    }

    private async Task<string> ResolveParticipantName()
    {
        var userId = AbpSession.UserId;
        if (!userId.HasValue)
        {
            return "Participant";
        }

        var user = await UserManager.GetUserByIdAsync(userId.Value);
        var fullName = $"{user.Name} {user.Surname}".Trim();
        if (!string.IsNullOrWhiteSpace(fullName))
        {
            return fullName;
        }

        if (!string.IsNullOrWhiteSpace(user.UserName))
        {
            return user.UserName;
        }

        return "Participant";
    }

    private async Task GenerateAndPersistBotTurn(int tenantId, SimulationSession session, SimulationScenario scenario, string triggerText)
    {
        var messages = await _messageRepository.GetAll()
            .Where(x => x.SessionId == session.Id)
            .OrderBy(x => x.CreationTime)
            .ToListAsync();
        var bots = await _botRepository.GetAll()
            .Where(x => x.SessionId == session.Id && x.IsActive)
            .ToListAsync();

        var nextRole = ResolveNextRole(bots, messages.Count(x => x.Role != ScenarioRole.User));
        if (session.OrchestratorNeeded)
        {
            await _orchestratorLogRepository.InsertAsync(new OrchestratorLog
            {
                TenantId = tenantId,
                SessionId = session.Id,
                TurnIndex = messages.Count + 1,
                NextBotRole = nextRole,
                CoherenceCheckPassed = true,
                CoherenceNotes = "Turn selected via orchestrator policy.",
                Timestamp = DateTime.UtcNow,
            });
        }

        var bot = bots.FirstOrDefault(x => x.Role == nextRole);
        var participantName = await ResolveParticipantName();
        var botReply = await GenerateBotReply(
            scenario,
            bot,
            messages.TakeLast(10).ToList(),
            triggerText,
            participantName);

        await _messageRepository.InsertAsync(new ScenarioMessage
        {
            TenantId = tenantId,
            SessionId = session.Id,
            Role = ToScenarioRole(nextRole),
            Content = botReply,
        });

        await CreateAssessorObservation(tenantId, session.Id, messages.Count + 1, triggerText, botReply);
    }

    private async Task CreateAssessorObservation(int tenantId, Guid sessionId, int turnIndex, string userMessage, string botReply)
    {
        var observation = new AssessorObservation
        {
            TenantId = tenantId,
            SessionId = sessionId,
            TurnIndex = turnIndex,
            ObservationText = "You communicated clearly. Improve by adding explicit expectations and asking for confirmation.",
        };

        await _observationRepository.InsertAsync(observation);
        await CurrentUnitOfWork.SaveChangesAsync();

        var clarityBoost = userMessage.Contains("because", StringComparison.OrdinalIgnoreCase) ? 6 : 0;
        var empathyBoost = userMessage.Contains("understand", StringComparison.OrdinalIgnoreCase) ? 6 : 0;
        var pushbackBoost = userMessage.Contains("I suggest", StringComparison.OrdinalIgnoreCase) ? 6 : 0;
        var baseScore = Math.Min(85, 62 + Math.Min((userMessage.Length + botReply.Length) / 30, 16));

        var scores = new Dictionary<Dimension, double>
        {
            [Dimension.Clarity] = Math.Min(100, baseScore + clarityBoost),
            [Dimension.PushbackQuality] = Math.Min(100, baseScore - 3 + pushbackBoost),
            [Dimension.EmotionalIntelligence] = Math.Min(100, baseScore - 2 + empathyBoost),
            [Dimension.ConflictHandling] = Math.Min(100, baseScore - 1),
            [Dimension.RoomReading] = Math.Min(100, baseScore - 4),
        };

        foreach (var score in scores)
        {
            await _dimensionScoreRepository.InsertAsync(new AssessorDimensionScore
            {
                TenantId = tenantId,
                ObservationId = observation.Id,
                Dimension = score.Key,
                Score = score.Value,
            });
        }
    }

    private static ScenarioRole ToScenarioRole(BotRole role)
    {
        return role switch
        {
            BotRole.Stakeholder => ScenarioRole.StakeholderBot,
            BotRole.Facilitator => ScenarioRole.FacilitatorBot,
            _ => ScenarioRole.MemberBot,
        };
    }

    private static List<(string Name, string Traits)> ExtractPersonaCandidates(string scenarioPrompt, string participantName)
    {
        if (string.IsNullOrWhiteSpace(scenarioPrompt))
        {
            return new List<(string Name, string Traits)>();
        }

        var candidates = new List<(string Name, string Traits)>();
        var safeParticipantName = participantName?.Trim() ?? string.Empty;

        foreach (Match match in PersonaRegex.Matches(scenarioPrompt))
        {
            var name = match.Groups["name"].Value.Trim();
            var traits = match.Groups["traits"].Value.Trim();
            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(traits))
            {
                continue;
            }

            if (name.Equals("You", StringComparison.OrdinalIgnoreCase) ||
                name.Equals("User", StringComparison.OrdinalIgnoreCase) ||
                name.Equals("I", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!string.IsNullOrWhiteSpace(safeParticipantName) &&
                name.Equals(safeParticipantName, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (candidates.Any(item => item.Name.Equals(name, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            candidates.Add((name, traits));
        }

        return candidates;
    }

    private static bool PromptImpliesManagerCounterpart(string scenarioPrompt)
    {
        if (string.IsNullOrWhiteSpace(scenarioPrompt))
        {
            return false;
        }

        return ManagerKeywords.Any(keyword => scenarioPrompt.Contains(keyword, StringComparison.OrdinalIgnoreCase));
    }

    private static bool PromptImpliesDifficultCommunication(string scenarioPrompt)
    {
        if (string.IsNullOrWhiteSpace(scenarioPrompt))
        {
            return false;
        }

        return scenarioPrompt.Contains("unclear", StringComparison.OrdinalIgnoreCase) ||
               scenarioPrompt.Contains("missed deadline", StringComparison.OrdinalIgnoreCase) ||
               scenarioPrompt.Contains("frustration", StringComparison.OrdinalIgnoreCase) ||
               scenarioPrompt.Contains("dismissive", StringComparison.OrdinalIgnoreCase) ||
               scenarioPrompt.Contains("condescending", StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildBotPersonality(BotRole role, string scenarioTitle, string scenarioPrompt, string participantName)
    {
        var personas = ExtractPersonaCandidates(scenarioPrompt, participantName);
        var selectedPersona = personas.FirstOrDefault();
        var personaName = string.IsNullOrWhiteSpace(selectedPersona.Name) ? null : selectedPersona.Name;
        var personaTraits = string.IsNullOrWhiteSpace(selectedPersona.Traits) ? null : selectedPersona.Traits;
        var managerCounterpart = PromptImpliesManagerCounterpart(scenarioPrompt);
        var difficultCommunication = PromptImpliesDifficultCommunication(scenarioPrompt);

        var roleBaseline = role switch
        {
            BotRole.Facilitator => $"You facilitate the {scenarioTitle} discussion and keep action items explicit.",
            BotRole.Stakeholder => $"You represent stakeholder priorities in {scenarioTitle} and ask for risk visibility.",
            _ => $"You are a teammate in {scenarioTitle} and focus on collaboration and practical next steps.",
        };

        if (role == BotRole.Stakeholder && managerCounterpart && difficultCommunication)
        {
            return $"{roleBaseline} You are the manager in this scenario. Your communication is unclear and occasionally dismissive/condescending under pressure, which causes confusion and frustration. Keep that difficult style consistent until the participant actively de-escalates and clarifies expectations.";
        }

        if (!string.IsNullOrWhiteSpace(personaName) && !string.IsNullOrWhiteSpace(personaTraits))
        {
            return $"{roleBaseline} You are '{personaName}' and your communication style is: {personaTraits}. Stay consistent with this style in every response. In the scenario prompt, 'You' refers to participant '{participantName}'.";
        }

        return role switch
        {
            BotRole.Facilitator => $"{roleBaseline} In the scenario prompt, 'You' refers to participant '{participantName}'.",
            BotRole.Stakeholder => $"{roleBaseline} In the scenario prompt, 'You' refers to participant '{participantName}'.",
            _ => $"{roleBaseline} In the scenario prompt, 'You' refers to participant '{participantName}'.",
        };
    }
}
