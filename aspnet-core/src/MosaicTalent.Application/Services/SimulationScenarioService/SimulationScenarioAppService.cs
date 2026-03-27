using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Simulations;
using MosaicTalent.Services.AiService;
using MosaicTalent.Services.SimulationScenarioService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace MosaicTalent.Services.SimulationScenarioService;

[AbpAuthorize]
public partial class SimulationScenarioAppService : MosaicTalentAppServiceBase, ISimulationScenarioAppService
{
    private readonly IRepository<Developer, Guid> _developerRepository;
    private readonly IRepository<SimulationScenario, Guid> _scenarioRepository;
    private readonly IRepository<SimulationScenarioRequiredRole, Guid> _requiredRoleRepository;
    private readonly IRepository<SimulationSession, Guid> _sessionRepository;
    private readonly IRepository<ScenarioMessage, Guid> _messageRepository;
    private readonly IRepository<SimulationBot, Guid> _botRepository;
    private readonly IRepository<OrchestratorLog, Guid> _orchestratorLogRepository;
    private readonly IRepository<AssessorObservation, Guid> _observationRepository;
    private readonly IRepository<AssessorDimensionScore, Guid> _dimensionScoreRepository;
    private readonly IGroqChatService _groqChatService;

    public SimulationScenarioAppService(
        IRepository<Developer, Guid> developerRepository,
        IRepository<SimulationScenario, Guid> scenarioRepository,
        IRepository<SimulationScenarioRequiredRole, Guid> requiredRoleRepository,
        IRepository<SimulationSession, Guid> sessionRepository,
        IRepository<ScenarioMessage, Guid> messageRepository,
        IRepository<SimulationBot, Guid> botRepository,
        IRepository<OrchestratorLog, Guid> orchestratorLogRepository,
        IRepository<AssessorObservation, Guid> observationRepository,
        IRepository<AssessorDimensionScore, Guid> dimensionScoreRepository,
        IGroqChatService groqChatService)
    {
        _developerRepository = developerRepository;
        _scenarioRepository = scenarioRepository;
        _requiredRoleRepository = requiredRoleRepository;
        _sessionRepository = sessionRepository;
        _messageRepository = messageRepository;
        _botRepository = botRepository;
        _orchestratorLogRepository = orchestratorLogRepository;
        _observationRepository = observationRepository;
        _dimensionScoreRepository = dimensionScoreRepository;
        _groqChatService = groqChatService;
    }

    public async Task<List<SimulationScenarioDto>> GetScenarios()
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        await EnsureCurrentDeveloper();
        await EnsureDefaultScenarios(tenantId);

        var scenarios = await _scenarioRepository.GetAll()
            .Where(x => x.TenantId == tenantId)
            .OrderBy(x => x.Title)
            .ToListAsync();

        return await MapScenarios(scenarios);
    }

    public async Task<SimulationScenarioDto> CreateScenario(CreateSimulationScenarioInput input)
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        await EnsureCurrentDeveloper();

        var scenario = new SimulationScenario
        {
            TenantId = tenantId,
            Title = input.Title.Trim(),
            Prompt = input.Prompt.Trim(),
            BotCount = input.BotCount,
        };

        await _scenarioRepository.InsertAsync(scenario);
        await CurrentUnitOfWork.SaveChangesAsync();

        var roles = (input.RequiredRoles ?? new List<string>())
            .Select(ParseBotRole)
            .Distinct()
            .ToList();

        foreach (var role in roles)
        {
            await _requiredRoleRepository.InsertAsync(new SimulationScenarioRequiredRole
            {
                TenantId = tenantId,
                ScenarioId = scenario.Id,
                Role = role,
            });
        }

        await CurrentUnitOfWork.SaveChangesAsync();
        var mapped = await MapScenarios(new List<SimulationScenario> { scenario });
        return mapped.First();
    }

    public async Task<SimulationSessionDto> StartSession(StartSimulationSessionInput input)
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        await EnsureCurrentDeveloper();

        var scenario = await _scenarioRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == input.ScenarioId && x.TenantId == tenantId)
            ?? throw new UserFriendlyException("Simulation scenario not found.");

        var requiredRoles = await _requiredRoleRepository.GetAll()
            .Where(x => x.ScenarioId == scenario.Id)
            .Select(x => x.Role)
            .Distinct()
            .ToListAsync();
        var speakingRoles = requiredRoles
            .Where(role => role != BotRole.Assessor && role != BotRole.Orchestrator)
            .Distinct()
            .ToList();
        var sessionType = ParseSessionType(input.SessionType, speakingRoles.Count);

        var session = new SimulationSession
        {
            TenantId = tenantId,
            ScenarioId = scenario.Id,
            SessionType = sessionType,
            OrchestratorNeeded = sessionType == SessionType.MeetingSimulation || speakingRoles.Count >= 3,
        };

        await _sessionRepository.InsertAsync(session);
        await CurrentUnitOfWork.SaveChangesAsync();

        var rolesToCreate = speakingRoles.Count > 0 ? speakingRoles : new List<BotRole> { BotRole.Teammate };
        var order = 1;
        foreach (var role in rolesToCreate)
        {
            await _botRepository.InsertAsync(new SimulationBot
            {
                TenantId = tenantId,
                SessionId = session.Id,
                Role = role,
                PersonalityPrompt = BuildDefaultPersonality(role, scenario.Title),
                CurrentState = "Ready",
                IsActive = true,
                TurnOrder = order++,
            });
        }

        await _botRepository.InsertAsync(new SimulationBot
        {
            TenantId = tenantId,
            SessionId = session.Id,
            Role = BotRole.Assessor,
            PersonalityPrompt = "Observe communication quality and provide concise coaching notes.",
            CurrentState = "Observing",
            IsActive = true,
            TurnOrder = null,
        });

        if (session.OrchestratorNeeded)
        {
            await _botRepository.InsertAsync(new SimulationBot
            {
                TenantId = tenantId,
                SessionId = session.Id,
                Role = BotRole.Orchestrator,
                PersonalityPrompt = "Manage speaking turns and maintain conversation coherence.",
                CurrentState = "Managing flow",
                IsActive = true,
                TurnOrder = null,
            });
        }

        await CurrentUnitOfWork.SaveChangesAsync();

        if (session.SessionType == SessionType.MeetingSimulation)
        {
            await GenerateAndPersistBotTurn(tenantId, session, scenario, "Meeting kickoff");
            await GenerateAndPersistBotTurn(tenantId, session, scenario, "Continue discussion");
        }

        return await GetSession(new GetSimulationSessionInput { SessionId = session.Id });
    }

    public async Task<SimulationSessionDto> GetSession(GetSimulationSessionInput input)
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        await EnsureCurrentDeveloper();

        var session = await _sessionRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == input.SessionId && x.TenantId == tenantId)
            ?? throw new UserFriendlyException("Simulation session not found.");

        return await MapSession(session);
    }

    public async Task<SimulationSessionDto> SendMessage(SendScenarioMessageInput input)
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var user = await EnsureCurrentDeveloper();
        var content = (input.Content ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new UserFriendlyException("Message content is required.");
        }

        var session = await _sessionRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == input.SessionId && x.TenantId == tenantId)
            ?? throw new UserFriendlyException("Simulation session not found.");
        var scenario = await _scenarioRepository.FirstOrDefaultAsync(session.ScenarioId)
            ?? throw new UserFriendlyException("Simulation scenario not found.");

        await _messageRepository.InsertAsync(new ScenarioMessage
        {
            TenantId = tenantId,
            SessionId = session.Id,
            Role = ScenarioRole.User,
            Content = content,
        });
        await CurrentUnitOfWork.SaveChangesAsync();

        await GenerateAndPersistBotTurn(tenantId, session, scenario, content);
        await CurrentUnitOfWork.SaveChangesAsync();

        return await GetSession(new GetSimulationSessionInput { SessionId = session.Id });
    }

    public async Task<SimulationSessionDto> AdvanceSession(GetSimulationSessionInput input)
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        await EnsureCurrentDeveloper();

        var session = await _sessionRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == input.SessionId && x.TenantId == tenantId)
            ?? throw new UserFriendlyException("Simulation session not found.");
        var scenario = await _scenarioRepository.FirstOrDefaultAsync(session.ScenarioId)
            ?? throw new UserFriendlyException("Simulation scenario not found.");

        if (session.SessionType == SessionType.MeetingSimulation)
        {
            var messages = await _messageRepository.GetAll()
                .Where(x => x.SessionId == session.Id)
                .OrderBy(x => x.CreationTime)
                .ToListAsync();

            if (!IsAwaitingUserInput(messages))
            {
                await GenerateAndPersistBotTurn(tenantId, session, scenario, "Meeting progression");
                await CurrentUnitOfWork.SaveChangesAsync();
            }
        }

        return await GetSession(new GetSimulationSessionInput { SessionId = session.Id });
    }

    public async Task<SimulationFeedbackDto> EvaluateSession(GetSimulationSessionInput input)
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        await EnsureCurrentDeveloper();
        if (!_groqChatService.IsConfigured())
        {
            throw new UserFriendlyException("AI evaluation is not configured. Please set Groq configuration.");
        }

        var session = await _sessionRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == input.SessionId && x.TenantId == tenantId)
            ?? throw new UserFriendlyException("Simulation session not found.");
        var scenario = await _scenarioRepository.FirstOrDefaultAsync(session.ScenarioId)
            ?? throw new UserFriendlyException("Simulation scenario not found.");

        var messages = await _messageRepository.GetAll()
            .Where(x => x.SessionId == session.Id)
            .OrderBy(x => x.CreationTime)
            .ToListAsync();

        var observations = await _observationRepository.GetAll()
            .Where(x => x.SessionId == session.Id)
            .OrderBy(x => x.TurnIndex)
            .ToListAsync();
        var observationIds = observations.Select(x => x.Id).ToList();
        var scores = await _dimensionScoreRepository.GetAll()
            .Where(x => observationIds.Contains(x.ObservationId))
            .ToListAsync();

        var aiFeedback = await EvaluateWithGroq(scenario, messages, observations, scores);
        if (aiFeedback != null)
        {
            aiFeedback.GeneratedByAi = true;
            return aiFeedback;
        }
        throw new UserFriendlyException("AI evaluation failed. Please retry the simulation evaluation.");
    }

    private async Task<SimulationFeedbackDto> EvaluateWithGroq(
        SimulationScenario scenario,
        List<ScenarioMessage> messages,
        List<AssessorObservation> observations,
        List<AssessorDimensionScore> scores)
    {
        if (!_groqChatService.IsConfigured())
        {
            return null;
        }

        var prompt = new
        {
            scenario = new
            {
                scenario.Title,
                scenario.Prompt,
            },
            conversation = messages.Select(x => new { role = x.Role.ToString(), x.Content }),
            observations = observations.Select(observation => new
            {
                observation.TurnIndex,
                observation.ObservationText,
                dimensions = scores
                    .Where(score => score.ObservationId == observation.Id)
                    .Select(score => new { dimension = score.Dimension.ToString(), score.Score })
                    .ToList(),
            }).ToList(),
            required = "Return JSON with communicationScore, empathyScore, resolutionScore, overallScore, summary, strengths[], improvements[], tips[]",
        };

        var systemPrompt = "You are an expert workplace communication assessor. Return objective, concise scoring and coaching as JSON only.";
        var userPrompt = JsonSerializer.Serialize(prompt);
        var result = await _groqChatService.TryCompleteAsync(systemPrompt, userPrompt);
        if (string.IsNullOrWhiteSpace(result))
        {
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(result);
            return new SimulationFeedbackDto
            {
                CommunicationScore = ReadScore(doc.RootElement, "communicationScore"),
                EmpathyScore = ReadScore(doc.RootElement, "empathyScore"),
                ResolutionScore = ReadScore(doc.RootElement, "resolutionScore"),
                OverallScore = ReadScore(doc.RootElement, "overallScore"),
                Summary = ReadString(doc.RootElement, "summary"),
                Strengths = ReadStringList(doc.RootElement, "strengths"),
                Improvements = ReadStringList(doc.RootElement, "improvements"),
                Tips = ReadStringList(doc.RootElement, "tips"),
            };
        }
        catch
        {
            return null;
        }
    }

    private static double ReadScore(JsonElement root, string name)
    {
        return root.TryGetProperty(name, out var value) && value.TryGetDouble(out var score)
            ? Math.Clamp(score, 0, 100)
            : 0;
    }

    private static string ReadString(JsonElement root, string name)
    {
        return root.TryGetProperty(name, out var value) ? value.GetString() ?? string.Empty : string.Empty;
    }

    private static List<string> ReadStringList(JsonElement root, string name)
    {
        if (!root.TryGetProperty(name, out var value) || value.ValueKind != JsonValueKind.Array)
        {
            return new List<string>();
        }

        return value.EnumerateArray()
            .Select(item => item.GetString())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .ToList();
    }
}
