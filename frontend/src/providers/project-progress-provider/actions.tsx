import { createAction } from "redux-actions";
import { IProjectProgressEntry, IProjectProgressStateContext } from "./context";

export enum ProjectProgressStateEnums {
  FETCH_PENDING = "PROJECT_PROGRESS_FETCH_PENDING",
  FETCH_SUCCESS = "PROJECT_PROGRESS_FETCH_SUCCESS",
  FETCH_ERROR = "PROJECT_PROGRESS_FETCH_ERROR",
  SAVE_PENDING = "PROJECT_PROGRESS_SAVE_PENDING",
  SAVE_SUCCESS = "PROJECT_PROGRESS_SAVE_SUCCESS",
  SAVE_ERROR = "PROJECT_PROGRESS_SAVE_ERROR",
}

type StatePatch = Partial<IProjectProgressStateContext>;

export const fetchPending = createAction<StatePatch>(ProjectProgressStateEnums.FETCH_PENDING, () => ({
  isPending: true, isSuccess: false, isError: false,
}));
export const fetchSuccess = createAction<StatePatch, IProjectProgressEntry[]>(ProjectProgressStateEnums.FETCH_SUCCESS, (entries) => ({
  isPending: false, isSuccess: true, isError: false, entries,
}));
export const fetchError = createAction<StatePatch>(ProjectProgressStateEnums.FETCH_ERROR, () => ({
  isPending: false, isSuccess: false, isError: true,
}));
export const savePending = createAction<StatePatch>(ProjectProgressStateEnums.SAVE_PENDING, () => ({
  isPending: true, isSuccess: false, isError: false,
}));
export const saveSuccess = createAction<StatePatch, IProjectProgressEntry[]>(ProjectProgressStateEnums.SAVE_SUCCESS, (entries) => ({
  isPending: false, isSuccess: true, isError: false, entries,
}));
export const saveError = createAction<StatePatch>(ProjectProgressStateEnums.SAVE_ERROR, () => ({
  isPending: false, isSuccess: false, isError: true,
}));
