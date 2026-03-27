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
  IAssessmentPromptResult,
  ICreateJobInput,
  IApplyToPublicJobInput,
  IJobAssessment,
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
  aiProjects: Array.isArray(input.aiProjects)
    ? input.aiProjects
        .filter((x) => typeof x === "object" && x !== null)
        .map((x) => ({
          name: typeof (x as { name?: unknown }).name === "string" ? ((x as { name: string }).name) : "",
          description: typeof (x as { description?: unknown }).description === "string" ? ((x as { description: string }).description) : "",
          score: typeof (x as { score?: unknown }).score === "number" ? ((x as { score: number }).score) : 0,
          technologies: Array.isArray((x as { technologies?: unknown }).technologies)
            ? ((x as { technologies: unknown[] }).technologies.filter((t): t is string => typeof t === "string"))
            : [],
        }))
    : [],
  aiMosaic:
    input.aiMosaic && typeof input.aiMosaic === "object"
      ? Object.fromEntries(
          Object.entries(input.aiMosaic as Record<string, unknown>).filter(
            (entry): entry is [string, number] => typeof entry[1] === "number",
          ),
        )
      : {},
  assessmentId: input.assessmentId ? String(input.assessmentId) : "",
  assessmentStatus: input.assessmentStatus ?? "",
  assessmentScore: typeof input.assessmentScore === "number" ? input.assessmentScore : undefined,
  assessmentVerdict: input.assessmentVerdict ?? "",
  assessmentSubmittedAt: input.assessmentSubmittedAt ?? "",
});

const normalizeAssessment = (input: Partial<IJobAssessment>): IJobAssessment => ({
  id: String(input.id ?? ""),
  jobId: String(input.jobId ?? ""),
  jobApplicationId: input.jobApplicationId ? String(input.jobApplicationId) : "",
  publicJobApplicationId: input.publicJobApplicationId ? String(input.publicJobApplicationId) : "",
  candidateName: input.candidateName ?? "",
  candidateEmail: input.candidateEmail ?? "",
  jobTitle: input.jobTitle ?? "",
  companyName: input.companyName ?? "",
  prompt: input.prompt ?? "",
  instructions: input.instructions ?? "",
  status: input.status ?? "pending",
  submissionText: input.submissionText ?? "",
  submissionGithubRepo: input.submissionGithubRepo ?? "",
  score: Number(input.score ?? 0),
  verdict: input.verdict ?? "",
  strengths: Array.isArray(input.strengths) ? input.strengths.filter((x): x is string => typeof x === "string") : [],
  weaknesses: Array.isArray(input.weaknesses) ? input.weaknesses.filter((x): x is string => typeof x === "string") : [],
  tips: Array.isArray(input.tips) ? input.tips.filter((x): x is string => typeof x === "string") : [],
  submittedAt: input.submittedAt ?? "",
  problems: Array.isArray(input.problems)
    ? input.problems
        .filter((x) => typeof x === "object" && x !== null)
        .map((problem) => ({
          id: typeof (problem as { id?: unknown }).id === "string" ? (problem as { id: string }).id : "",
          title: typeof (problem as { title?: unknown }).title === "string" ? (problem as { title: string }).title : "",
          description:
            typeof (problem as { description?: unknown }).description === "string"
              ? (problem as { description: string }).description
              : "",
          language:
            typeof (problem as { language?: unknown }).language === "string"
              ? (problem as { language: string }).language
              : "javascript",
          starterCode:
            typeof (problem as { starterCode?: unknown }).starterCode === "string"
              ? (problem as { starterCode: string }).starterCode
              : "",
          maxScore:
            typeof (problem as { maxScore?: unknown }).maxScore === "number"
              ? (problem as { maxScore: number }).maxScore
              : 100,
          order: typeof (problem as { order?: unknown }).order === "number" ? (problem as { order: number }).order : 0,
          publicTests: Array.isArray((problem as { publicTests?: unknown }).publicTests)
            ? ((problem as { publicTests: unknown[] }).publicTests
                .filter((test) => typeof test === "object" && test !== null)
                .map((test) => ({
                  input: typeof (test as { input?: unknown }).input === "string" ? (test as { input: string }).input : "",
                  expectedOutput:
                    typeof (test as { expectedOutput?: unknown }).expectedOutput === "string"
                      ? (test as { expectedOutput: string }).expectedOutput
                      : "",
                  hint: typeof (test as { hint?: unknown }).hint === "string" ? (test as { hint: string }).hint : "",
                })))
            : [],
        }))
    : [],
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
      body: "Hi {candidateName},\n\nThanks for applying to {companyName} for {jobTitle}. We received your application.\n\nComplete your assessment here:\n{assessmentLink}\n\nRegards,\n{companyName} Team",
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

  const bulkMoveToAssessment = async (input: { jobId: string; minimumMatchScore?: number; currentStatuses?: number[] }) => {
    dispatch(updateJobPending());

    try {
      const res = await instance.post(`${ENDPOINT}/BulkMoveApplicationsToAssessment`, {
        jobId: input.jobId,
        minimumMatchScore: input.minimumMatchScore ?? 0,
        currentStatuses: input.currentStatuses ?? [],
        includeMemberApplications: true,
        includePublicApplications: true,
      });
      const updated = Number(res.data?.result ?? 0);
      dispatch(updateJobSuccess());
      await fetchJobApplications(input.jobId);
      await fetchMyJobs();
      return updated;
    } catch (error) {
      dispatch(updateJobError());
      throw new Error(readApiErrorMessage(error, "Failed to move applications to assessment."));
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

  const getAssessment = async (assessmentId: string) => {
    try {
      const res = await instance.get(`${ENDPOINT}/GetAssessment`, {
        params: {
          assessmentId,
          AssessmentId: assessmentId,
          "input.assessmentId": assessmentId,
        },
      });
      return normalizeAssessment((res.data?.result ?? {}) as Partial<IJobAssessment>);
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to load assessment."));
    }
  };

  const submitAssessment = async (input: { assessmentId: string; submissionText: string; githubRepoUrl?: string }) => {
    try {
      const res = await instance.post(`${ENDPOINT}/SubmitAssessment`, {
        assessmentId: input.assessmentId,
        submissionText: input.submissionText,
        githubRepoUrl: input.githubRepoUrl ?? "",
      });
      return normalizeAssessment((res.data?.result ?? {}) as Partial<IJobAssessment>);
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to submit assessment."));
    }
  };

  const runAssessmentPrompt = async (input: { assessmentId: string; problemId: string; prompt: string }) => {
    try {
      const res = await instance.post(`${ENDPOINT}/RunAssessmentPrompt`, {
        assessmentId: input.assessmentId,
        problemId: input.problemId,
        prompt: input.prompt,
      });

      const result = (res.data?.result ?? {}) as Partial<IAssessmentPromptResult>;
      return {
        problemId: String(result.problemId ?? ""),
        prompt: result.prompt ?? "",
        response: result.response ?? "",
        promptTokens: Number(result.promptTokens ?? 0),
        completionTokens: Number(result.completionTokens ?? 0),
        totalTokens: Number(result.totalTokens ?? 0),
      };
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to run AI prompt."));
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
          bulkMoveToAssessment,
          sendApplicationEmail,
          getAssessment,
          runAssessmentPrompt,
          submitAssessment,
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
  IAssessmentPromptResult,
  IJobCandidate,
  IJob,
  IJobApplication,
  IJobAssessment,
  IJobAssessmentProblem,
  IPublicJobsPage,
  IUpdateJobsPageSettingsInput,
  IUpdateJobInput,
} from "./context";
