"use client";

import { createContext } from "react";

export interface ISimulationScenario {
  id: string;
  title: string;
  prompt: string;
  botCount: number;
  requiredRoles: string[];
}

export interface ISimulationMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface ISimulationBot {
  id: string;
  role: string;
  personalityPrompt: string;
  currentState: string;
  isActive: boolean;
  turnOrder?: number;
}

export interface IDimensionScore {
  dimension: string;
  score: number;
}

export interface IAssessorObservation {
  turnIndex: number;
  observationText: string;
  dimensionScores: IDimensionScore[];
}

export interface ISimulationFeedback {
  communicationScore: number;
  empathyScore: number;
  resolutionScore: number;
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  tips: string[];
  generatedByAi: boolean;
}

export interface ISimulationVoiceTurnResult {
  session: ISimulationSession;
  replyText: string;
  replyRole?: string;
  replyMessageId?: string;
  voiceModel?: string;
  audioBase64?: string;
  audioMimeType?: string;
}

export interface ISimulationRealtimeEvent {
  type:
    | "turn_started"
    | "session_updated"
    | "bot_text"
    | "bot_audio"
    | "turn_completed"
    | "error"
    | "interrupt_ack";
  payload?: Record<string, unknown>;
}

export interface ISimulationSession {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  sessionType: string;
  orchestratorNeeded: boolean;
  awaitingUserInput: boolean;
  messages: ISimulationMessage[];
  bots: ISimulationBot[];
  observations: IAssessorObservation[];
}

export interface ISimulationStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  scenarios: ISimulationScenario[];
  activeSession?: ISimulationSession;
}

export interface ISimulationActionContext {
  fetchScenarios: () => Promise<void>;
  createScenario: (input: {
    title: string;
    prompt: string;
    botCount: number;
    requiredRoles: string[];
  }) => Promise<ISimulationScenario | undefined>;
  startSession: (input: { scenarioId: string; sessionType?: string }) => Promise<ISimulationSession | undefined>;
  getSession: (sessionId: string) => Promise<ISimulationSession | undefined>;
  advanceSession: (sessionId: string) => Promise<ISimulationSession | undefined>;
  sendMessage: (sessionId: string, content: string) => Promise<ISimulationSession | undefined>;
  sendVoiceTurn: (
    sessionId: string,
    content: string,
  ) => Promise<ISimulationVoiceTurnResult | undefined>;
  connectRealtime: (
    sessionId: string,
    onEvent: (event: ISimulationRealtimeEvent) => void,
  ) => Promise<void>;
  disconnectRealtime: () => Promise<void>;
  sendRealtimeMessage: (sessionId: string, content: string) => Promise<void>;
  interruptRealtime: () => Promise<void>;
  evaluateSession: (sessionId: string) => Promise<ISimulationFeedback | undefined>;
}

export const INITIAL_STATE: ISimulationStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  scenarios: [],
  activeSession: undefined,
};

export const SimulationStateContext = createContext<ISimulationStateContext>(INITIAL_STATE);

export const SimulationActionContext = createContext<ISimulationActionContext>({
  fetchScenarios: async () => undefined,
  createScenario: async () => undefined,
  startSession: async () => undefined,
  getSession: async () => undefined,
  advanceSession: async () => undefined,
  sendMessage: async () => undefined,
  sendVoiceTurn: async () => undefined,
  connectRealtime: async () => undefined,
  disconnectRealtime: async () => undefined,
  sendRealtimeMessage: async () => undefined,
  interruptRealtime: async () => undefined,
  evaluateSession: async () => undefined,
});
