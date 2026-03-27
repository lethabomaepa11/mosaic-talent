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
  isPublicApplication?: boolean;
  applicationResponseJson?: string;
  aiStrengths?: string[];
  aiWeaknesses?: string[];
  aiVerdict?: string;
  aiExtractedSkills?: string[];
  aiGithubRepo?: string;
}

export interface IJobCandidate {
  developerId: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  githubUsername?: string;
}

export interface IJob {
  id: string;
  companyId: string;
  companyName: string;
  companyLogoStoredFileId?: string;
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

export interface IPublicJobsPage {
  companyId: string;
  companyName: string;
  tenancyName: string;
  companyLogoStoredFileId?: string;
  companyEmail?: string;
  companyWebsiteUrl?: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl?: string;
  primaryColor: string;
  layoutJson: string;
  applicationFormJson: string;
  emailTemplateSettingsJson: string;
}

export interface IUpdateJobsPageSettingsInput {
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl?: string;
  primaryColor: string;
  layoutJson: string;
  applicationFormJson: string;
  emailTemplateSettingsJson: string;
}

export interface IApplyToPublicJobInput {
  jobId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  resumeStoredFileId?: string;
  technicalAssessmentAnswer?: string;
  behaviouralAssessmentAnswer?: string;
  responsesJson?: string;
  source?: number;
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
  publicJobsPage?: IPublicJobsPage;
}

export interface IJobActionContext {
  fetchMyJobs: () => Promise<void>;
  fetchOpenJobs: () => Promise<void>;
  fetchPublicJobsPage: () => Promise<IPublicJobsPage | undefined>;
  createJob: (input: ICreateJobInput) => Promise<IJob | undefined>;
  updateJob: (input: IUpdateJobInput) => Promise<IJob | undefined>;
  toggleJobOpenStatus: (jobId: string, isOpen: boolean) => Promise<IJob | undefined>;
  fetchJobApplications: (jobId: string) => Promise<IJobApplication[]>;
  fetchCandidatesDirectory: () => Promise<IJobCandidate[]>;
  getMyJobsPageSettings: () => Promise<IPublicJobsPage | undefined>;
  updateMyJobsPageSettings: (input: IUpdateJobsPageSettingsInput) => Promise<IPublicJobsPage | undefined>;
  generateMyJobsPageSettingsWithAi: (prompt: string) => Promise<IPublicJobsPage | undefined>;
  applyToJob: (jobId: string, payload?: { source?: number; resumeStoredFileId?: string }) => Promise<IJobApplication | undefined>;
  applyToPublicJob: (input: IApplyToPublicJobInput) => Promise<IJobApplication | undefined>;
  updateApplicationStatus: (jobApplicationId: string, status: number) => Promise<IJobApplication | undefined>;
  sendApplicationEmail: (jobApplicationId: string, subject: string, message: string) => Promise<void>;
}

export const INITIAL_STATE: IJobStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  jobs: [],
  selectedJob: undefined,
  publicJobsPage: undefined,
};

export const JobStateContext = createContext<IJobStateContext>(INITIAL_STATE);

export const JobActionContext = createContext<IJobActionContext>({
  fetchMyJobs: async () => undefined,
  fetchOpenJobs: async () => undefined,
  fetchPublicJobsPage: async () => undefined,
  createJob: async () => undefined,
  updateJob: async () => undefined,
  toggleJobOpenStatus: async () => undefined,
  fetchJobApplications: async () => [],
  fetchCandidatesDirectory: async () => [],
  getMyJobsPageSettings: async () => undefined,
  updateMyJobsPageSettings: async () => undefined,
  generateMyJobsPageSettingsWithAi: async () => undefined,
  applyToJob: async () => undefined,
  applyToPublicJob: async () => undefined,
  updateApplicationStatus: async () => undefined,
  sendApplicationEmail: async () => undefined,
});
