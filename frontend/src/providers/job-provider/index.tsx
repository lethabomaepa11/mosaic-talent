"use client";

import { PropsWithChildren, useContext, useReducer } from "react";
import { AxiosError } from "axios";
import { getAxiosInstance } from "@/utils/axiosInstance";
import {
  createJobError,
  createJobPending,
  createJobSuccess,
  fetchJobError,
  fetchJobPending,
  fetchJobsError,
  fetchJobsPending,
  fetchJobsSuccess,
  fetchJobSuccess,
  updateJobError,
  updateJobPending,
  updateJobSuccess,
} from "./actions";
import {
  ICreateJobInput,
  IJob,
  IJobApplication,
  IUpdateJobInput,
  INITIAL_STATE,
  JobActionContext,
  JobStateContext,
} from "./context";
import { JobReducer } from "./reducer";

const ENDPOINT = "/api/services/app/CompanyJob";

const readApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.error?.message as string | undefined;
    return message || fallback;
  }

  return fallback;
};

const normalizeApplication = (input: Partial<IJobApplication>): IJobApplication => ({
  id: String(input.id ?? ""),
  jobId: String(input.jobId ?? ""),
  candidateDeveloperId: String(input.candidateDeveloperId ?? ""),
  candidateName: input.candidateName ?? "",
  candidateEmail: input.candidateEmail ?? "",
  resumeStoredFileId: input.resumeStoredFileId ?? "",
  matchScore: Number(input.matchScore ?? 0),
  matchReason: input.matchReason ?? "",
  source: input.source ?? "other",
  status: input.status ?? "applied",
  createdAt: input.createdAt ?? new Date().toISOString(),
});

const normalizeJob = (input: Partial<IJob>): IJob => ({
  id: String(input.id ?? ""),
  companyId: String(input.companyId ?? ""),
  title: input.title ?? "",
  description: input.description ?? "",
  location: input.location ?? "",
  employmentType: input.employmentType ?? "full-time",
  isOpen: Boolean(input.isOpen),
  contractDuration: input.contractDuration,
  technicalAssessmentPrompt: input.technicalAssessmentPrompt ?? "",
  behaviouralAssessmentPrompt: input.behaviouralAssessmentPrompt ?? "",
  createdAt: input.createdAt ?? new Date().toISOString(),
  applicationCount: Number(input.applicationCount ?? 0),
  applications: (input.applications ?? []).map(normalizeApplication),
});

const normalizeJobList = (input: unknown): IJob[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((job) => normalizeJob(job as Partial<IJob>));
};

const normalizeApplicationList = (input: unknown): IJobApplication[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((application) => normalizeApplication(application as Partial<IJobApplication>));
};

export const JobProvider = ({ children }: PropsWithChildren) => {
  const instance = getAxiosInstance();
  const [state, dispatch] = useReducer(JobReducer, INITIAL_STATE);

  const fetchMyJobs = async () => {
    dispatch(fetchJobsPending());

    try {
      const res = await instance.get(`${ENDPOINT}/GetMyJobs`);
      dispatch(fetchJobsSuccess(normalizeJobList(res.data?.result)));
    } catch {
      dispatch(fetchJobsError());
    }
  };

  const createJob = async (input: ICreateJobInput) => {
    dispatch(createJobPending());

    try {
      const res = await instance.post(`${ENDPOINT}/CreateJob`, input);
      const job = normalizeJob((res.data?.result ?? {}) as Partial<IJob>);
      dispatch(createJobSuccess());
      await fetchMyJobs();
      return job;
    } catch (error) {
      dispatch(createJobError());
      throw new Error(readApiErrorMessage(error, "Failed to create job."));
    }
  };

  const updateJob = async (input: IUpdateJobInput) => {
    dispatch(updateJobPending());

    try {
      const res = await instance.put(`${ENDPOINT}/UpdateJob`, input);
      const job = normalizeJob((res.data?.result ?? {}) as Partial<IJob>);
      dispatch(updateJobSuccess());
      await fetchMyJobs();
      return job;
    } catch (error) {
      dispatch(updateJobError());
      throw new Error(readApiErrorMessage(error, "Failed to update job."));
    }
  };

  const toggleJobOpenStatus = async (jobId: string, isOpen: boolean) => {
    dispatch(updateJobPending());

    try {
      const res = await instance.put(`${ENDPOINT}/ToggleJobOpenStatus`, { jobId, isOpen });
      const job = normalizeJob((res.data?.result ?? {}) as Partial<IJob>);
      dispatch(updateJobSuccess());
      await fetchMyJobs();
      return job;
    } catch (error) {
      dispatch(updateJobError());
      throw new Error(readApiErrorMessage(error, "Failed to update job status."));
    }
  };

  const fetchJobApplications = async (jobId: string) => {
    dispatch(fetchJobPending());

    try {
      const res = await instance.get(`${ENDPOINT}/GetJobApplications`, {
        params: {
          jobId,
          JobId: jobId,
          "input.jobId": jobId,
        },
      });
      const applications = normalizeApplicationList(res.data?.result);
      const existing = state.jobs.find((item) => item.id === jobId);
      if (existing) {
        dispatch(fetchJobSuccess({ ...existing, applications }));
      }
      return applications;
    } catch (error) {
      dispatch(fetchJobError());
      throw new Error(readApiErrorMessage(error, "Failed to load job applications."));
    }
  };

  const updateApplicationStatus = async (jobApplicationId: string, status: number) => {
    dispatch(updateJobPending());

    try {
      const res = await instance.put(`${ENDPOINT}/UpdateJobApplicationStatus`, {
        jobApplicationId,
        status,
      });
      const application = normalizeApplication((res.data?.result ?? {}) as Partial<IJobApplication>);
      dispatch(updateJobSuccess());
      if (application.jobId) {
        await fetchJobApplications(application.jobId);
      }
      await fetchMyJobs();
      return application;
    } catch (error) {
      dispatch(updateJobError());
      throw new Error(readApiErrorMessage(error, "Failed to update application status."));
    }
  };

  return (
    <JobStateContext.Provider value={state}>
      <JobActionContext.Provider
        value={{
          fetchMyJobs,
          createJob,
          updateJob,
          toggleJobOpenStatus,
          fetchJobApplications,
          updateApplicationStatus,
        }}
      >
        {children}
      </JobActionContext.Provider>
    </JobStateContext.Provider>
  );
};

export const useJobState = () => {
  return useContext(JobStateContext);
};

export const useJobAction = () => {
  return useContext(JobActionContext);
};

export type {
  ICreateJobInput,
  IJob,
  IJobApplication,
  IUpdateJobInput,
} from "./context";
