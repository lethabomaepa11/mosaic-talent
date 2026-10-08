import { handleActions } from "redux-actions";
import { INITIAL_STATE, IJobStateContext } from "./context";
import { JobStateEnums } from "./actions";

type JobStatePatch = Partial<IJobStateContext>;

export const JobReducer = handleActions<IJobStateContext, JobStatePatch>(
  {
    [JobStateEnums.JOB_FETCH_ALL_PENDING]: (state, { payload }) => ({ ...state, ...payload }),
    [JobStateEnums.JOB_FETCH_ALL_SUCCESS]: (state, { payload }) => ({ ...state, ...payload }),
    [JobStateEnums.JOB_FETCH_ALL_ERROR]: (state, { payload }) => ({ ...state, ...payload }),
    [JobStateEnums.JOB_FETCH_ONE_PENDING]: (state, { payload }) => ({ ...state, ...payload }),
    [JobStateEnums.JOB_FETCH_ONE_SUCCESS]: (state, { payload }) => ({ ...state, ...payload }),
    [JobStateEnums.JOB_FETCH_ONE_ERROR]: (state, { payload }) => ({ ...state, ...payload }),
    [JobStateEnums.JOB_CREATE_PENDING]: (state, { payload }) => ({ ...state, ...payload }),
    [JobStateEnums.JOB_CREATE_SUCCESS]: (state, { payload }) => ({ ...state, ...payload }),
    [JobStateEnums.JOB_CREATE_ERROR]: (state, { payload }) => ({ ...state, ...payload }),
    [JobStateEnums.JOB_UPDATE_PENDING]: (state, { payload }) => ({ ...state, ...payload }),
    [JobStateEnums.JOB_UPDATE_SUCCESS]: (state, { payload }) => ({ ...state, ...payload }),
    [JobStateEnums.JOB_UPDATE_ERROR]: (state, { payload }) => ({ ...state, ...payload }),
    [JobStateEnums.JOB_PUBLIC_PAGE_SUCCESS]: (state, { payload }) => ({ ...state, ...payload }),
  },
  INITIAL_STATE,
);
