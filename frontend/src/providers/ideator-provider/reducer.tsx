import { handleActions } from "redux-actions";
import { INITIAL_IDEATOR_STATE, IIdeatorState } from "./context";
import { IdeatorStateEnums } from "./actions";
export const IdeatorReducer = handleActions<IIdeatorState, Partial<IIdeatorState>>({
  [IdeatorStateEnums.PENDING]: (state, { payload }) => ({ ...state, ...payload }),
  [IdeatorStateEnums.SUCCESS]: (state, { payload }) => ({ ...state, ...payload }),
  [IdeatorStateEnums.ERROR]: (state, { payload }) => ({ ...state, ...payload }),
}, INITIAL_IDEATOR_STATE);
