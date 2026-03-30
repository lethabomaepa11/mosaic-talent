"use client";

import { createContext } from "react";
import { IAppOperatorIntent } from "@/lib/app-operator/types";
import { IAppOperatorPlanningResult } from "@/lib/app-operator/planner";

export interface IOperatorHistoryItem {
  id: string;
  role: "assistant" | "user";
  text: string;
}

export interface IOperatorPendingConfirmation {
  intent: IAppOperatorIntent;
  summary: string;
}

export interface IAppOperatorStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  history: IOperatorHistoryItem[];
  pendingConfirmation?: IOperatorPendingConfirmation;
}

export interface IAppOperatorActionContext {
  addUserMessage: (text: string) => void;
  addAssistantMessage: (text: string) => void;
  setPending: (value: boolean) => void;
  setError: () => void;
  setSuccess: () => void;
  setConfirmation: (confirmation?: IOperatorPendingConfirmation) => void;
  clearHistory: () => void;
  planCommand: (
    command: string,
    currentPath: string,
  ) => Promise<IAppOperatorPlanningResult>;
}

export const INITIAL_STATE: IAppOperatorStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  history: [],
  pendingConfirmation: undefined,
};

export const AppOperatorStateContext =
  createContext<IAppOperatorStateContext>(INITIAL_STATE);
export const AppOperatorActionContext =
  createContext<IAppOperatorActionContext>({
    addUserMessage: () => undefined,
    addAssistantMessage: () => undefined,
    setPending: () => undefined,
    setError: () => undefined,
    setSuccess: () => undefined,
    setConfirmation: () => undefined,
    clearHistory: () => undefined,
    planCommand: async (command) => ({
      intent: {
        type: "navigate",
        rawCommand: command,
        routeKey: "dashboard",
        params: { route: "/app" },
        missingRequired: [],
        requiresConfirmation: false,
      },
      source: "fallback",
    }),
  });
