import { handleActions } from "redux-actions";
import { DeveloperStateEnums } from "./actions";
import { IDeveloperStateContext, INITIAL_STATE } from "./context";

type DeveloperStatePatch = Partial<IDeveloperStateContext>;

export const DeveloperReducer = handleActions<
  IDeveloperStateContext,
  DeveloperStatePatch
>(
  {
    [DeveloperStateEnums.DEVELOPER_FETCH_PROFILE_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [DeveloperStateEnums.DEVELOPER_FETCH_PROFILE_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [DeveloperStateEnums.DEVELOPER_FETCH_PROFILE_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [DeveloperStateEnums.DEVELOPER_FETCH_LEVELS_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [DeveloperStateEnums.DEVELOPER_FETCH_LEVELS_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [DeveloperStateEnums.DEVELOPER_FETCH_LEVELS_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [DeveloperStateEnums.DEVELOPER_FETCH_USER_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [DeveloperStateEnums.DEVELOPER_FETCH_USER_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [DeveloperStateEnums.DEVELOPER_FETCH_USER_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [DeveloperStateEnums.DEVELOPER_SAVE_PROFILE_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [DeveloperStateEnums.DEVELOPER_SAVE_PROFILE_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [DeveloperStateEnums.DEVELOPER_SAVE_PROFILE_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [DeveloperStateEnums.DEVELOPER_SCAN_GITHUB_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [DeveloperStateEnums.DEVELOPER_SCAN_GITHUB_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [DeveloperStateEnums.DEVELOPER_SCAN_GITHUB_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
  },
  INITIAL_STATE,
);
