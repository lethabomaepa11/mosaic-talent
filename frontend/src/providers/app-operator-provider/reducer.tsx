import { handleActions } from "redux-actions";
import { AppOperatorStateEnums } from "./actions";
import { IAppOperatorStateContext, INITIAL_STATE } from "./context";

type AppOperatorStatePatch = Partial<IAppOperatorStateContext>;

export const AppOperatorReducer = handleActions<
  IAppOperatorStateContext,
  AppOperatorStatePatch
>(
  {
    [AppOperatorStateEnums.APP_OPERATOR_USER_MESSAGE]: (state, { payload }) => ({
      ...state,
      history: [...state.history, ...((payload?.history as typeof state.history) ?? [])],
    }),
    [AppOperatorStateEnums.APP_OPERATOR_ASSISTANT_MESSAGE]: (state, { payload }) => ({
      ...state,
      history: [...state.history, ...((payload?.history as typeof state.history) ?? [])],
    }),
    [AppOperatorStateEnums.APP_OPERATOR_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AppOperatorStateEnums.APP_OPERATOR_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AppOperatorStateEnums.APP_OPERATOR_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AppOperatorStateEnums.APP_OPERATOR_SET_CONFIRMATION]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AppOperatorStateEnums.APP_OPERATOR_CLEAR_HISTORY]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
  },
  INITIAL_STATE,
);
