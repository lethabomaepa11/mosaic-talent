"use client";

import { PropsWithChildren, useContext, useMemo, useReducer } from "react";
import { planOperatorIntent } from "@/lib/app-operator/planner";
import { getAxiosInstance } from "@/utils/axiosInstance";
import {
  addAssistantMessage,
  addUserMessage,
  clearHistory,
  setConfirmation,
  setError,
  setPending,
  setSuccess,
} from "./actions";
import {
  AppOperatorActionContext,
  AppOperatorStateContext,
  INITIAL_STATE,
  IOperatorPendingConfirmation,
} from "./context";
import { AppOperatorReducer } from "./reducer";

const toHistoryItem = (role: "assistant" | "user", text: string) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  text,
});

export const AppOperatorProvider = ({ children }: PropsWithChildren) => {
  const instance = getAxiosInstance();
  const [state, dispatch] = useReducer(AppOperatorReducer, INITIAL_STATE);

  const actions = useMemo(
    () => ({
      addUserMessage: (text: string) =>
        dispatch(addUserMessage(toHistoryItem("user", text))),
      addAssistantMessage: (text: string) =>
        dispatch(addAssistantMessage(toHistoryItem("assistant", text))),
      setPending: (value: boolean) => dispatch(setPending(value)),
      setError: () => dispatch(setError()),
      setSuccess: () => dispatch(setSuccess()),
      setConfirmation: (confirmation?: IOperatorPendingConfirmation) =>
        dispatch(setConfirmation(confirmation)),
      clearHistory: () => dispatch(clearHistory()),
      planCommand: (command: string, currentPath: string) =>
        planOperatorIntent(instance, command, currentPath),
    }),
    [instance],
  );

  return (
    <AppOperatorStateContext.Provider value={state}>
      <AppOperatorActionContext.Provider value={actions}>
        {children}
      </AppOperatorActionContext.Provider>
    </AppOperatorStateContext.Provider>
  );
};

export const useAppOperatorState = () => useContext(AppOperatorStateContext);
export const useAppOperatorAction = () => useContext(AppOperatorActionContext);
