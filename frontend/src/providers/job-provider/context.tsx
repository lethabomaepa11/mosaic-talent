"use client";

import { createContext } from "react";

export interface IJobApplication {
  id: string;
  jobId: string;
  candidateDeveloperId: string;
  candidateName: string;
  candidateEmail: string;
  resumeStoredFileId?: string;
  matchScore: number;
  matchReason: string;
  source: string;
  status: string;
  createdAt: string;
}

export interface IJob {
  id: string;
  companyId: string;
  title: string;
  description: string;
  location: string;
  employmentType: string;
  isOpen: boolean;
  contractDuration?: number;
  technicalAssessmentPrompt?: string;
  behaviouralAssessmentPrompt?: string;
  createdAt: string;
  applicationCount: number;
  applications: IJobApplication[];
}

export interface ICreateJobInput {
  title: string;
  description: string;
  location: string;
  employmentType: number;
  isOpen: boolean;
  contractDuration?: number;
  technicalAssessmentPrompt?: string;
  behaviouralAssessmentPrompt?: string;
}

export interface IUpdateJobInput extends ICreateJobInput {
  jobId: string;
}

export interface IJobStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  jobs: IJob[];
  selectedJob?: IJob;
}

export interface IJobActionContext {
  fetchMyJobs: () => Promise<void>;
  createJob: (input: ICreateJobInput) => Promise<IJob | undefined>;
  updateJob: (input: IUpdateJobInput) => Promise<IJob | undefined>;
  toggleJobOpenStatus: (jobId: string, isOpen: boolean) => Promise<IJob | undefined>;
  fetchJobApplications: (jobId: string) => Promise<IJobApplication[]>;
  updateApplicationStatus: (jobApplicationId: string, status: number) => Promise<IJobApplication | undefined>;
}

export const INITIAL_STATE: IJobStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  jobs: [],
  selectedJob: undefined,
};

export const JobStateContext = createContext<IJobStateContext>(INITIAL_STATE);

export const JobActionContext = createContext<IJobActionContext>({
  fetchMyJobs: async () => undefined,
  createJob: async () => undefined,
  updateJob: async () => undefined,
  toggleJobOpenStatus: async () => undefined,
  fetchJobApplications: async () => [],
  updateApplicationStatus: async () => undefined,
});
