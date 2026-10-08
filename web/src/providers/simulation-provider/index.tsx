"use client";

import { AxiosError } from "axios";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { PropsWithChildren, useContext, useReducer } from "react";
import { getAuthToken, getAxiosInstance } from "@/utils/axiosInstance";
import {
  createScenarioError,
  createScenarioPending,
  createScenarioSuccess,
  fetchScenariosError,
  fetchScenariosPending,
  fetchScenariosSuccess,
  sessionError,
  sessionPending,
  sessionSuccess,
} from "./actions";
import {
  IDimensionScore,
  INITIAL_STATE,
  IAssessorObservation,
  ISimulationBot,
  ISimulationFeedback,
  ISimulationMessage,
  ISimulationRealtimeEvent,
  ISimulationScenario,
  ISimulationSession,
  ISimulationVoiceTurnResult,
  SimulationActionContext,
  SimulationStateContext,
} from "./context";
import { SimulationReducer } from "./reducer";

const ENDPOINT = "/api/services/app/SimulationScenario";
const SIGNALR_ENDPOINT = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/signalr-simulation`;

let simulationConnection: HubConnection | null = null;
let realtimeEventHandler: ((event: ISimulationRealtimeEvent) => void) | null = null;

const readApiError = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    return (error.response?.data?.error?.message as string | undefined) || fallback;
  }
  return fallback;
};

const normalizeScenario = (input: Partial<ISimulationScenario>): ISimulationScenario => ({
  id: String(input.id ?? ""),
  title: input.title ?? "",
  prompt: input.prompt ?? "",
  botCount: Number(input.botCount ?? 1),
  requiredRoles: input.requiredRoles ?? [],
});

const normalizeMessage = (input: Partial<ISimulationMessage>): ISimulationMessage => ({
  id: String(input.id ?? ""),
  role: input.role ?? "",
  content: input.content ?? "",
  createdAt: input.createdAt ?? new Date().toISOString(),
});

const normalizeBot = (input: Partial<ISimulationBot>): ISimulationBot => ({
  id: String(input.id ?? ""),
  role: input.role ?? "",
  personalityPrompt: input.personalityPrompt ?? "",
  currentState: input.currentState ?? "",
  isActive: Boolean(input.isActive),
  turnOrder: input.turnOrder,
});

const normalizeDimensionScore = (input: Partial<IDimensionScore>): IDimensionScore => ({
  dimension: input.dimension ?? "",
  score: Number(input.score ?? 0),
});

const normalizeObservation = (input: Partial<IAssessorObservation>): IAssessorObservation => ({
  turnIndex: Number(input.turnIndex ?? 0),
  observationText: input.observationText ?? "",
  dimensionScores: (input.dimensionScores ?? []).map(normalizeDimensionScore),
});

const normalizeSession = (input: Partial<ISimulationSession>): ISimulationSession => ({
  id: String(input.id ?? ""),
  scenarioId: String(input.scenarioId ?? ""),
  scenarioTitle: input.scenarioTitle ?? "",
  sessionType: input.sessionType ?? "",
  orchestratorNeeded: Boolean(input.orchestratorNeeded),
  awaitingUserInput: Boolean(input.awaitingUserInput),
  messages: (input.messages ?? []).map(normalizeMessage),
  bots: (input.bots ?? []).map(normalizeBot),
  observations: (input.observations ?? []).map(normalizeObservation),
});

const normalizeFeedback = (input: Partial<ISimulationFeedback>): ISimulationFeedback => ({
  communicationScore: Number(input.communicationScore ?? 0),
  empathyScore: Number(input.empathyScore ?? 0),
  resolutionScore: Number(input.resolutionScore ?? 0),
  overallScore: Number(input.overallScore ?? 0),
  summary: input.summary ?? "",
  strengths: input.strengths ?? [],
  improvements: input.improvements ?? [],
  tips: input.tips ?? [],
  generatedByAi: Boolean(input.generatedByAi),
});

export const SimulationProvider = ({ children }: PropsWithChildren) => {
  const instance = getAxiosInstance();
  const [state, dispatch] = useReducer(SimulationReducer, INITIAL_STATE);

  const fetchScenarios = async () => {
    dispatch(fetchScenariosPending());
    try {
      const res = await instance.get(`${ENDPOINT}/GetScenarios`);
      const scenarios = Array.isArray(res.data?.result)
        ? (res.data.result as Array<Partial<ISimulationScenario>>).map(normalizeScenario)
        : [];
      dispatch(fetchScenariosSuccess(scenarios));
    } catch (error) {
      dispatch(fetchScenariosError());
      throw new Error(readApiError(error, "Failed to load simulation scenarios."));
    }
  };

  const createScenario = async (input: {
    title: string;
    prompt: string;
    botCount: number;
    requiredRoles: string[];
  }) => {
    dispatch(createScenarioPending());
    try {
      const res = await instance.post(`${ENDPOINT}/CreateScenario`, input);
      const scenario = normalizeScenario(res.data?.result ?? {});
      dispatch(createScenarioSuccess());
      await fetchScenarios();
      return scenario;
    } catch (error) {
      dispatch(createScenarioError());
      throw new Error(readApiError(error, "Failed to create scenario."));
    }
  };

  const startSession = async (input: { scenarioId: string; sessionType?: string }) => {
    dispatch(sessionPending());
    try {
      const res = await instance.post(`${ENDPOINT}/StartSession`, input);
      const session = normalizeSession(res.data?.result ?? {});
      dispatch(sessionSuccess(session));
      return session;
    } catch (error) {
      dispatch(sessionError());
      throw new Error(readApiError(error, "Failed to start simulation session."));
    }
  };

  const getSession = async (sessionId: string) => {
    dispatch(sessionPending());
    try {
      const res = await instance.get(`${ENDPOINT}/GetSession`, {
        params: { sessionId, SessionId: sessionId, "input.sessionId": sessionId },
      });
      const session = normalizeSession(res.data?.result ?? {});
      dispatch(sessionSuccess(session));
      return session;
    } catch (error) {
      dispatch(sessionError());
      throw new Error(readApiError(error, "Failed to load simulation session."));
    }
  };

  const advanceSession = async (sessionId: string) => {
    dispatch(sessionPending());
    try {
      const res = await instance.post(`${ENDPOINT}/AdvanceSession`, { sessionId });
      const session = normalizeSession(res.data?.result ?? {});
      dispatch(sessionSuccess(session));
      return session;
    } catch (error) {
      dispatch(sessionError());
      throw new Error(readApiError(error, "Failed to advance simulation session."));
    }
  };

  const sendMessage = async (sessionId: string, content: string) => {
    dispatch(sessionPending());
    try {
      const res = await instance.post(`${ENDPOINT}/SendMessage`, { sessionId, content });
      const session = normalizeSession(res.data?.result ?? {});
      dispatch(sessionSuccess(session));
      return session;
    } catch (error) {
      dispatch(sessionError());
      throw new Error(readApiError(error, "Failed to send message."));
    }
  };

  const evaluateSession = async (sessionId: string) => {
    try {
      const res = await instance.post(`${ENDPOINT}/EvaluateSession`, { sessionId });
      return normalizeFeedback((res.data?.result ?? {}) as Partial<ISimulationFeedback>);
    } catch (error) {
      dispatch(sessionError());
      throw new Error(readApiError(error, "Failed to evaluate simulation session."));
    }
  };

  const sendVoiceTurn = async (sessionId: string, content: string) => {
    dispatch(sessionPending());
    try {
      const res = await instance.post("/api/services/app/SimulationVoice/Turn", {
        sessionId,
        content,
      });
      const result = (res.data?.result ?? {}) as Partial<ISimulationVoiceTurnResult> & {
        session?: Partial<ISimulationSession>;
      };
      const session = normalizeSession(result.session ?? {});
      dispatch(sessionSuccess(session));
      return {
        session,
        replyText: result.replyText ?? "",
        replyRole: result.replyRole ?? "",
        replyMessageId: result.replyMessageId ?? "",
        voiceModel: result.voiceModel ?? "",
        audioBase64: result.audioBase64,
        audioMimeType: result.audioMimeType,
      } as ISimulationVoiceTurnResult;
    } catch (error) {
      dispatch(sessionError());
      throw new Error(readApiError(error, "Failed to process voice turn."));
    }
  };

  const emitRealtimeEvent = (event: ISimulationRealtimeEvent) => {
    if (realtimeEventHandler) {
      realtimeEventHandler(event);
    }
  };

  const ensureRealtimeConnection = async () => {
    if (!simulationConnection) {
      simulationConnection = new HubConnectionBuilder()
        .withUrl(SIGNALR_ENDPOINT, {
          accessTokenFactory: () => getAuthToken(),
          withCredentials: true,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();

      simulationConnection.on("simulation_turn_started", (payload: Record<string, unknown>) => {
        emitRealtimeEvent({ type: "turn_started", payload });
      });
      simulationConnection.on("simulation_session_updated", (payload: Record<string, unknown>) => {
        const session = normalizeSession((payload?.session as Partial<ISimulationSession>) ?? {});
        dispatch(sessionSuccess(session));
        emitRealtimeEvent({ type: "session_updated", payload });
      });
      simulationConnection.on("simulation_bot_text", (payload: Record<string, unknown>) => {
        emitRealtimeEvent({ type: "bot_text", payload });
      });
      simulationConnection.on("simulation_bot_audio", (payload: Record<string, unknown>) => {
        emitRealtimeEvent({ type: "bot_audio", payload });
      });
      simulationConnection.on("simulation_turn_completed", (payload: Record<string, unknown>) => {
        emitRealtimeEvent({ type: "turn_completed", payload });
      });
      simulationConnection.on("simulation_interrupt_ack", (payload: Record<string, unknown>) => {
        emitRealtimeEvent({ type: "interrupt_ack", payload });
      });
      simulationConnection.on("simulation_error", (message: string) => {
        emitRealtimeEvent({ type: "error", payload: { message } });
      });
    }

    if (simulationConnection.state === "Disconnected") {
      await simulationConnection.start();
    }
  };

  const connectRealtime = async (
    sessionId: string,
    onEvent: (event: ISimulationRealtimeEvent) => void,
  ) => {
    realtimeEventHandler = onEvent;
    await ensureRealtimeConnection();
    await simulationConnection?.invoke("JoinSession", sessionId);
  };

  const disconnectRealtime = async () => {
    realtimeEventHandler = null;
    if (simulationConnection && simulationConnection.state !== "Disconnected") {
      await simulationConnection.stop();
    }
  };

  const sendRealtimeMessage = async (sessionId: string, content: string) => {
    await ensureRealtimeConnection();
    await simulationConnection?.invoke("SendUserMessage", sessionId, content);
  };

  const interruptRealtime = async () => {
    if (!simulationConnection || simulationConnection.state !== "Connected") {
      return;
    }
    await simulationConnection.invoke("Interrupt");
  };

  return (
    <SimulationStateContext.Provider value={state}>
      <SimulationActionContext.Provider value={{
        fetchScenarios,
        createScenario,
        startSession,
        getSession,
        advanceSession,
        sendMessage,
        sendVoiceTurn,
        connectRealtime,
        disconnectRealtime,
        sendRealtimeMessage,
        interruptRealtime,
        evaluateSession,
      }}>
        {children}
      </SimulationActionContext.Provider>
    </SimulationStateContext.Provider>
  );
};

export const useSimulationState = () => useContext(SimulationStateContext);
export const useSimulationAction = () => useContext(SimulationActionContext);
