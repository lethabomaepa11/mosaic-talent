import { createAction } from "redux-actions";
import { AppearanceMode, IAppearanceStateContext } from "./context";

export type AppearanceStatePatch = Partial<IAppearanceStateContext>;

export enum AppearanceStateEnums {
  APPEARANCE_HYDRATE_PENDING = "APPEARANCE_HYDRATE_PENDING",
  APPEARANCE_HYDRATE_SUCCESS = "APPEARANCE_HYDRATE_SUCCESS",
  APPEARANCE_HYDRATE_ERROR = "APPEARANCE_HYDRATE_ERROR",
  APPEARANCE_SET_MODE = "APPEARANCE_SET_MODE",
}

export const hydrateModePending = createAction<AppearanceStatePatch>(
  AppearanceStateEnums.APPEARANCE_HYDRATE_PENDING,
  () => ({
    isPending: true,
    isSuccess: false,
    isError: false,
  }),
);

export const hydrateModeSuccess = createAction<AppearanceStatePatch, AppearanceMode>(
  AppearanceStateEnums.APPEARANCE_HYDRATE_SUCCESS,
  (mode) => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    mode,
    isHydrated: true,
  }),
);

export const hydrateModeError = createAction<AppearanceStatePatch>(
  AppearanceStateEnums.APPEARANCE_HYDRATE_ERROR,
  () => ({
    isPending: false,
    isSuccess: false,
    isError: true,
    isHydrated: true,
    mode: "dark",
  }),
);

export const setModeAction = createAction<AppearanceStatePatch, AppearanceMode>(
  AppearanceStateEnums.APPEARANCE_SET_MODE,
  (mode) => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    mode,
    isHydrated: true,
  }),
);
