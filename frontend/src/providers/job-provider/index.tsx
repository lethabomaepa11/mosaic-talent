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
  publicJobsPageSuccess,
  updateJobError,
  updateJobPending,
  updateJobSuccess,
} from "./actions";
import {
  ICreateJobInput,
  IApplyToPublicJobInput,
  IJobCandidate,
  IJob,
  IJobApplication,
  IPublicJobsPage,
  IUpdateJobsPageSettingsInput,
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
  isPublicApplication: Boolean(input.isPublicApplication),
  applicationResponseJson: input.applicationResponseJson ?? "",
  aiStrengths: Array.isArray(input.aiStrengths) ? input.aiStrengths.filter((x): x is string => typeof x === "string") : [],
  aiWeaknesses: Array.isArray(input.aiWeaknesses) ? input.aiWeaknesses.filter((x): x is string => typeof x === "string") : [],
  aiVerdict: input.aiVerdict ?? "",
  aiExtractedSkills: Array.isArray(input.aiExtractedSkills) ? input.aiExtractedSkills.filter((x): x is string => typeof x === "string") : [],
  aiGithubRepo: input.aiGithubRepo ?? "",
});

const normalizeCandidate = (input: Partial<IJobCandidate>): IJobCandidate => ({
  developerId: String(input.developerId ?? ""),
  userId: String(input.userId ?? ""),
  fullName: input.fullName ?? "",
  email: input.email ?? "",
  avatarUrl: input.avatarUrl ?? "",
  githubUsername: input.githubUsername ?? "",
});

const normalizeJob = (input: Partial<IJob>): IJob => ({
  id: String(input.id ?? ""),
  companyId: String(input.companyId ?? ""),
  companyName: input.companyName ?? "",
  companyLogoStoredFileId: input.companyLogoStoredFileId ?? "",
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

const defaultLayoutJson = JSON.stringify({
  blocks: [
    {
      id: "hero-1",
      type: "hero",
      props: {
        title: "Ready to become a team member?",
        subtitle: "Welcome to our recruitment platform. Explore opportunities and apply with confidence.",
      },
    },
    {
      id: "text-1",
      type: "text",
      props: {
        content: "We are excited to have you explore our career opportunities.\nOur platform connects you directly with our Human Capital team.",
      },
    },
    {
      id: "jobs-1",
      type: "job-list",
      props: {
        title: "Our Openings",
        subtitle: "Open positions",
        showCount: "true",
        label: "Apply",
      },
    },
    {
      id: "form-1",
      type: "form",
      props: {
        title: "Submit your application",
        subtitle: "Even if no role fits yet, you can still submit your profile.",
      },
    },
    {
      id: "cta-1",
      type: "cta",
      props: {
        title: "Keep in touch",
        subtitle: "Met us at a career fair? Share your details and stay connected.",
      },
    },
  ],
});

const normalizePublicJobsPage = (input: Partial<IPublicJobsPage>): IPublicJobsPage => ({
  companyId: String(input.companyId ?? ""),
  companyName: input.companyName ?? "",
  tenancyName: input.tenancyName ?? "",
  companyLogoStoredFileId: input.companyLogoStoredFileId ?? "",
  companyEmail: input.companyEmail ?? "",
  companyWebsiteUrl: input.companyWebsiteUrl ?? "",
  heroTitle: input.heroTitle ?? "Build your career with us",
  heroSubtitle: input.heroSubtitle ?? "Apply to open roles and show your strengths.",
  heroImageUrl: input.heroImageUrl ?? "",
  primaryColor: input.primaryColor ?? "#D4AF37",
  layoutJson: input.layoutJson && input.layoutJson.trim().length > 0 ? input.layoutJson : defaultLayoutJson,
  applicationFormJson: input.applicationFormJson ?? JSON.stringify({
    fields: [
      {
        key: "technicalAssessmentAnswer",
        label: "Technical Assessment",
        type: "textarea",
        required: false,
        placeholder: "Tell us how you solve technical challenges.",
      },
      {
        key: "behaviouralAssessmentAnswer",
        label: "Behavioural Assessment",
        type: "textarea",
        required: false,
        placeholder: "Describe your collaboration and communication style.",
      },
    ],
  }),
  emailTemplateSettingsJson: input.emailTemplateSettingsJson ?? JSON.stringify({
    applicationReceived: {
      enabled: true,
      mode: "manual",
      subject: "Application received for {jobTitle}",
      body: "Hi {candidateName},\n\nThanks for applying to {companyName} for {jobTitle}. We received your application and our team will review it soon.\n\nRegards,\n{companyName} Team",
    },
  }),
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

const normalizeCandidateList = (input: unknown): IJobCandidate[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((candidate) => normalizeCandidate(candidate as Partial<IJobCandidate>));
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

  const fetchOpenJobs = async () => {
    dispatch(fetchJobsPending());

    try {
      const res = await instance.get(`${ENDPOINT}/GetOpenJobs`);
      dispatch(fetchJobsSuccess(normalizeJobList(res.data?.result)));
    } catch {
      dispatch(fetchJobsError());
    }
  };

  const fetchPublicJobsPage = async () => {
    try {
      const res = await instance.get(`${ENDPOINT}/GetPublicJobsPage`);
      const page = normalizePublicJobsPage((res.data?.result ?? {}) as Partial<IPublicJobsPage>);
      dispatch(publicJobsPageSuccess(page));
      return page;
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to load jobs page data."));
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

  const sendApplicationEmail = async (jobApplicationId: string, subject: string, message: string) => {
    dispatch(updateJobPending());

    try {
      await instance.post(`${ENDPOINT}/SendApplicationEmail`, {
        jobApplicationId,
        subject,
        message,
      });
      dispatch(updateJobSuccess());
    } catch (error) {
      dispatch(updateJobError());
      throw new Error(readApiErrorMessage(error, "Failed to send email."));
    }
  };

  const fetchCandidatesDirectory = async () => {
    try {
      const res = await instance.get(`${ENDPOINT}/GetCandidatesDirectory`);
      return normalizeCandidateList(res.data?.result);
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to load candidates."));
    }
  };

  const getMyJobsPageSettings = async () => {
    try {
      const res = await instance.get(`${ENDPOINT}/GetMyJobsPageSettings`);
      const page = normalizePublicJobsPage((res.data?.result ?? {}) as Partial<IPublicJobsPage>);
      dispatch(publicJobsPageSuccess(page));
      return page;
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to load jobs page settings."));
    }
  };

  const updateMyJobsPageSettings = async (input: IUpdateJobsPageSettingsInput) => {
    try {
      const res = await instance.put(`${ENDPOINT}/UpdateMyJobsPageSettings`, input);
      const page = normalizePublicJobsPage((res.data?.result ?? {}) as Partial<IPublicJobsPage>);
      dispatch(publicJobsPageSuccess(page));
      return page;
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to update jobs page settings."));
    }
  };

  const generateMyJobsPageSettingsWithAi = async (prompt: string) => {
    try {
      const res = await instance.post(`${ENDPOINT}/GenerateMyJobsPageSettingsWithAi`, { prompt });
      const page = normalizePublicJobsPage((res.data?.result ?? {}) as Partial<IPublicJobsPage>);
      dispatch(publicJobsPageSuccess(page));
      return page;
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "AI generation failed."));
    }
  };

  const applyToJob = async (
    jobId: string,
    payload?: { source?: number; resumeStoredFileId?: string },
  ) => {
    dispatch(updateJobPending());

    try {
      const res = await instance.post(`${ENDPOINT}/ApplyToJob`, {
        jobId,
        source: payload?.source ?? 5,
        resumeStoredFileId: payload?.resumeStoredFileId ?? "",
      });
      const application = normalizeApplication((res.data?.result ?? {}) as Partial<IJobApplication>);
      dispatch(updateJobSuccess());
      return application;
    } catch (error) {
      dispatch(updateJobError());
      throw new Error(readApiErrorMessage(error, "Failed to apply for this job."));
    }
  };

  const applyToPublicJob = async (input: IApplyToPublicJobInput) => {
    dispatch(updateJobPending());

    try {
      const res = await instance.post(`${ENDPOINT}/ApplyToPublicJob`, {
        ...input,
        responsesJson: input.responsesJson ?? "",
      });
      const application = normalizeApplication((res.data?.result ?? {}) as Partial<IJobApplication>);
      dispatch(updateJobSuccess());
      return application;
    } catch (error) {
      dispatch(updateJobError());
      throw new Error(readApiErrorMessage(error, "Failed to apply for this job."));
    }
  };

  return (
    <JobStateContext.Provider value={state}>
      <JobActionContext.Provider
        value={{
          fetchMyJobs,
          fetchOpenJobs,
          fetchPublicJobsPage,
          createJob,
          updateJob,
          toggleJobOpenStatus,
          fetchJobApplications,
          fetchCandidatesDirectory,
          getMyJobsPageSettings,
          updateMyJobsPageSettings,
          generateMyJobsPageSettingsWithAi,
          applyToJob,
          applyToPublicJob,
          updateApplicationStatus,
          sendApplicationEmail,
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
  IApplyToPublicJobInput,
  ICreateJobInput,
  IJobCandidate,
  IJob,
  IJobApplication,
  IPublicJobsPage,
  IUpdateJobsPageSettingsInput,
  IUpdateJobInput,
} from "./context";
