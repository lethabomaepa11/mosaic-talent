"use client";
import { createContext } from "react";

export interface ISupportState {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error?: string;
}
export const INITIAL_STATE: ISupportState = { isPending: false, isSuccess: false, isError: false };
export const SupportStateContext = createContext(INITIAL_STATE);
export const SupportActionContext = createContext({ openSupport: async (): Promise<boolean> => false });
