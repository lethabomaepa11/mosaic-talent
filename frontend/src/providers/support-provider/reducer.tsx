import { handleActions } from "redux-actions";
import { INITIAL_STATE, type ISupportState } from "./context";
import { SupportStateEnums } from "./actions";

export const SupportReducer = handleActions<ISupportState, Partial<ISupportState>>({
  [SupportStateEnums.OPEN_PENDING]: (state, { payload }) => ({ ...state, ...payload }),
  [SupportStateEnums.OPEN_SUCCESS]: (state, { payload }) => ({ ...state, ...payload }),
  [SupportStateEnums.OPEN_ERROR]: (state, { payload }) => ({ ...state, ...payload }),
}, INITIAL_STATE);
