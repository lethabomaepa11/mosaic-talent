"use client";

import { AxiosError } from "axios";
import { PropsWithChildren, useContext, useReducer } from "react";
import { getAxiosInstance } from "@/utils/axiosInstance";
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
  ISimulationScenario,
  ISimulationSession,
  SimulationActionContext,
  SimulationStateContext,
} from "./context";
import { SimulationReducer } from "./reducer";

const ENDPOINT = "/api/services/app/SimulationScenario";

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

  return (
    <SimulationStateContext.Provider value={state}>
      <SimulationActionContext.Provider value={{ fetchScenarios, createScenario, startSession, getSession, advanceSession, sendMessage, evaluateSession }}>
        {children}
      </SimulationActionContext.Provider>
    </SimulationStateContext.Provider>
  );
};

export const useSimulationState = () => useContext(SimulationStateContext);
export const useSimulationAction = () => useContext(SimulationActionContext);
