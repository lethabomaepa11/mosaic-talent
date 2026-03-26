import { handleActions } from "redux-actions";
import { INITIAL_STATE, IProjectStateContext } from "./context";
import { ProjectStateEnums } from "./actions";

type ProjectStatePatch = Partial<IProjectStateContext>;

export const ProjectReducer = handleActions<
  IProjectStateContext,
  ProjectStatePatch
>(
  {
    [ProjectStateEnums.PROJECT_FETCH_MY_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_FETCH_MY_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_FETCH_MY_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_FETCH_OPEN_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_FETCH_OPEN_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_FETCH_OPEN_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_FETCH_ONE_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_FETCH_ONE_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_FETCH_ONE_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_CREATE_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_CREATE_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_CREATE_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_JOIN_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_JOIN_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_JOIN_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_MATCH_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_MATCH_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_MATCH_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_FILL_TEAM_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_FILL_TEAM_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_FILL_TEAM_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_ADD_TASK_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_ADD_TASK_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_ADD_TASK_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_UPDATE_TASK_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_UPDATE_TASK_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_UPDATE_TASK_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_UPDATE_SKILLS_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_UPDATE_SKILLS_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_UPDATE_SKILLS_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_COMPLETE_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_COMPLETE_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ProjectStateEnums.PROJECT_COMPLETE_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
  },
  INITIAL_STATE,
);
