import { createAction } from "redux-actions";
import { IJob, IJobStateContext, IPublicJobsPage } from "./context";

type JobStatePatch = Partial<IJobStateContext>;

export enum JobStateEnums {
  JOB_FETCH_ALL_PENDING = "JOB_FETCH_ALL_PENDING",
  JOB_FETCH_ALL_SUCCESS = "JOB_FETCH_ALL_SUCCESS",
  JOB_FETCH_ALL_ERROR = "JOB_FETCH_ALL_ERROR",
  JOB_FETCH_ONE_PENDING = "JOB_FETCH_ONE_PENDING",
  JOB_FETCH_ONE_SUCCESS = "JOB_FETCH_ONE_SUCCESS",
  JOB_FETCH_ONE_ERROR = "JOB_FETCH_ONE_ERROR",
  JOB_CREATE_PENDING = "JOB_CREATE_PENDING",
  JOB_CREATE_SUCCESS = "JOB_CREATE_SUCCESS",
  JOB_CREATE_ERROR = "JOB_CREATE_ERROR",
  JOB_UPDATE_PENDING = "JOB_UPDATE_PENDING",
  JOB_UPDATE_SUCCESS = "JOB_UPDATE_SUCCESS",
  JOB_UPDATE_ERROR = "JOB_UPDATE_ERROR",
  JOB_PUBLIC_PAGE_SUCCESS = "JOB_PUBLIC_PAGE_SUCCESS",
}

export const fetchJobsPending = createAction<JobStatePatch>(
  JobStateEnums.JOB_FETCH_ALL_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const fetchJobsSuccess = createAction<JobStatePatch, IJob[]>(
  JobStateEnums.JOB_FETCH_ALL_SUCCESS,
  (jobs) => ({ isPending: false, isSuccess: true, isError: false, jobs }),
);

export const fetchJobsError = createAction<JobStatePatch>(
  JobStateEnums.JOB_FETCH_ALL_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const fetchJobPending = createAction<JobStatePatch>(
  JobStateEnums.JOB_FETCH_ONE_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const fetchJobSuccess = createAction<JobStatePatch, IJob>(
  JobStateEnums.JOB_FETCH_ONE_SUCCESS,
  (selectedJob) => ({ isPending: false, isSuccess: true, isError: false, selectedJob }),
);

export const fetchJobError = createAction<JobStatePatch>(
  JobStateEnums.JOB_FETCH_ONE_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const createJobPending = createAction<JobStatePatch>(
  JobStateEnums.JOB_CREATE_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const createJobSuccess = createAction<JobStatePatch>(
  JobStateEnums.JOB_CREATE_SUCCESS,
  () => ({ isPending: false, isSuccess: true, isError: false }),
);

export const createJobError = createAction<JobStatePatch>(
  JobStateEnums.JOB_CREATE_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const updateJobPending = createAction<JobStatePatch>(
  JobStateEnums.JOB_UPDATE_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const updateJobSuccess = createAction<JobStatePatch>(
  JobStateEnums.JOB_UPDATE_SUCCESS,
  () => ({ isPending: false, isSuccess: true, isError: false }),
);

export const updateJobError = createAction<JobStatePatch>(
  JobStateEnums.JOB_UPDATE_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const publicJobsPageSuccess = createAction<JobStatePatch, IPublicJobsPage>(
  JobStateEnums.JOB_PUBLIC_PAGE_SUCCESS,
  (publicJobsPage) => ({ publicJobsPage }),
);
