import { createAction } from "redux-actions";
import {
  IAppOperatorStateContext,
  IOperatorHistoryItem,
  IOperatorPendingConfirmation,
} from "./context";

type AppOperatorStatePatch = Partial<IAppOperatorStateContext>;

export enum AppOperatorStateEnums {
  APP_OPERATOR_USER_MESSAGE = "APP_OPERATOR_USER_MESSAGE",
  APP_OPERATOR_ASSISTANT_MESSAGE = "APP_OPERATOR_ASSISTANT_MESSAGE",
  APP_OPERATOR_PENDING = "APP_OPERATOR_PENDING",
  APP_OPERATOR_SUCCESS = "APP_OPERATOR_SUCCESS",
  APP_OPERATOR_ERROR = "APP_OPERATOR_ERROR",
  APP_OPERATOR_SET_CONFIRMATION = "APP_OPERATOR_SET_CONFIRMATION",
  APP_OPERATOR_CLEAR_HISTORY = "APP_OPERATOR_CLEAR_HISTORY",
}

export const addUserMessage = createAction<AppOperatorStatePatch, IOperatorHistoryItem>(
  AppOperatorStateEnums.APP_OPERATOR_USER_MESSAGE,
  (entry) => ({ history: [entry] }),
);

export const addAssistantMessage = createAction<AppOperatorStatePatch, IOperatorHistoryItem>(
  AppOperatorStateEnums.APP_OPERATOR_ASSISTANT_MESSAGE,
  (entry) => ({ history: [entry] }),
);

export const setPending = createAction<AppOperatorStatePatch, boolean>(
  AppOperatorStateEnums.APP_OPERATOR_PENDING,
  (isPending) => ({ isPending, isSuccess: false, isError: false }),
);

export const setSuccess = createAction<AppOperatorStatePatch>(
  AppOperatorStateEnums.APP_OPERATOR_SUCCESS,
  () => ({ isPending: false, isSuccess: true, isError: false }),
);

export const setError = createAction<AppOperatorStatePatch>(
  AppOperatorStateEnums.APP_OPERATOR_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const setConfirmation = createAction<AppOperatorStatePatch, IOperatorPendingConfirmation | undefined>(
  AppOperatorStateEnums.APP_OPERATOR_SET_CONFIRMATION,
  (pendingConfirmation) => ({ pendingConfirmation }),
);

export const clearHistory = createAction<AppOperatorStatePatch>(
  AppOperatorStateEnums.APP_OPERATOR_CLEAR_HISTORY,
  () => ({ history: [] }),
);
