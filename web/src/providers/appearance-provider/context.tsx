"use client";

import { createContext } from "react";

export type AppearanceMode = "dark" | "light";

export interface IAppearanceStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  mode: AppearanceMode;
  isHydrated: boolean;
}

export interface IAppearanceActionContext {
  hydrateMode: () => void;
  setMode: (mode: AppearanceMode) => void;
  toggleMode: () => void;
}

export const INITIAL_STATE: IAppearanceStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  mode: "dark",
  isHydrated: false,
};

export const AppearanceStateContext =
  createContext<IAppearanceStateContext>(INITIAL_STATE);

export const AppearanceActionContext = createContext<IAppearanceActionContext>({
  hydrateMode: () => undefined,
  setMode: () => undefined,
  toggleMode: () => undefined,
});
