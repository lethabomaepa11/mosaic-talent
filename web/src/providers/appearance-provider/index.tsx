"use client";

import { PropsWithChildren, useCallback, useContext, useReducer } from "react";
import {
  hydrateModeError,
  hydrateModePending,
  hydrateModeSuccess,
  setModeAction,
} from "./actions";
import {
  AppearanceActionContext,
  AppearanceMode,
  AppearanceStateContext,
  INITIAL_STATE,
} from "./context";
import { AppearanceReducer } from "./reducer";

const THEME_STORAGE_KEY = "mosaic-talent.theme-mode";

const isAppearanceMode = (value: string | null): value is AppearanceMode => {
  return value === "dark" || value === "light";
};

const applyModeToDocument = (mode: AppearanceMode) => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-theme", mode);
  document.documentElement.style.colorScheme = mode;
};

const resolvePreferredMode = (): AppearanceMode => {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (isAppearanceMode(stored)) {
    return stored;
  }

  return "dark";
};

export const AppearanceProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(AppearanceReducer, INITIAL_STATE);

  const setMode = useCallback((mode: AppearanceMode) => {
    applyModeToDocument(mode);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    }

    dispatch(setModeAction(mode));
  }, []);

  const hydrateMode = useCallback(() => {
    dispatch(hydrateModePending());

    try {
      const preferredMode = resolvePreferredMode();
      applyModeToDocument(preferredMode);
      dispatch(hydrateModeSuccess(preferredMode));
    } catch {
      applyModeToDocument("dark");
      dispatch(hydrateModeError());
    }
  }, []);

  const toggleMode = useCallback(() => {
    const nextMode: AppearanceMode = state.mode === "dark" ? "light" : "dark";
    setMode(nextMode);
  }, [setMode, state.mode]);

  return (
    <AppearanceStateContext.Provider value={state}>
      <AppearanceActionContext.Provider
        value={{ hydrateMode, setMode, toggleMode }}
      >
        {children}
      </AppearanceActionContext.Provider>
    </AppearanceStateContext.Provider>
  );
};

export const useAppearanceState = () => {
  return useContext(AppearanceStateContext);
};

export const useAppearanceAction = () => {
  return useContext(AppearanceActionContext);
};
