import { handleActions } from "redux-actions";
import { INITIAL_STATE, IProjectProgressStateContext } from "./context";
import { ProjectProgressStateEnums } from "./actions";

type StatePatch = Partial<IProjectProgressStateContext>;

export const ProjectProgressReducer = handleActions<IProjectProgressStateContext, StatePatch>(
  {
    [ProjectProgressStateEnums.FETCH_PENDING]: (state, { payload }) => ({ ...state, ...payload }),
    [ProjectProgressStateEnums.FETCH_SUCCESS]: (state, { payload }) => ({ ...state, ...payload }),
    [ProjectProgressStateEnums.FETCH_ERROR]: (state, { payload }) => ({ ...state, ...payload }),
    [ProjectProgressStateEnums.SAVE_PENDING]: (state, { payload }) => ({ ...state, ...payload }),
    [ProjectProgressStateEnums.SAVE_SUCCESS]: (state, { payload }) => ({ ...state, ...payload }),
    [ProjectProgressStateEnums.SAVE_ERROR]: (state, { payload }) => ({ ...state, ...payload }),
  },
  INITIAL_STATE,
);
