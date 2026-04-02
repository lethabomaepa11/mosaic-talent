"use client";

import { createContext } from "react";

export interface IProjectMember {
  id: string;
  name: string;
  userName?: string;
  avatar: string;
  role: "lead" | "member";
}

export interface IProjectTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  assignedMemberId?: string;
  assignedMemberName?: string;
}

export interface IProject {
  id: string;
  title: string;
  description: string;
  maxMembers: number;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  estimatedHoursPerWeek: number;
  workloadScore: number;
  githubRepo?: string;
  skills: string[];
  type: string;
  status: string;
  ownerId: string;
  createdAt: string;
  matchScore?: number;
  matchInsight?: string;
  learningOutcomes?: string[];
  members: IProjectMember[];
  tasks: IProjectTask[];
}

export interface IProjectMatchResult {
  projectId: string;
  projectTitle: string;
  insight?: string;
  learningOutcomes: string[];
}

export interface IGithubConnectionStatus {
  isConnected: boolean;
  githubUsername: string;
}

export interface IGithubRepository {
  name: string;
  fullName: string;
  htmlUrl: string;
  isPrivate: boolean;
  defaultBranch: string;
}

export interface IRepoSafetyProgress {
  step: string;
  progress: number;
}

export interface IRepoSafetyFinding {
  ruleId: string;
  category: string;
  severity: string;
  title: string;
  description?: string;
  filePath?: string;
  points?: number;
}

export interface IRepoSafetyCategory {
  id: string;
  name: string;
  icon?: string;
  score?: number;
  maxScore?: number;
  findings: IRepoSafetyFinding[];
}

export interface IRepoSafetyBadge {
  type: string;
  label: string;
  description?: string;
}

export interface IRepoSafetyMeta {
  owner?: string;
  repo?: string;
  description?: string;
  stars?: number;
  forks?: number;
  createdAt?: string;
  pushedAt?: string;
  defaultBranch?: string;
  language?: string;
  topics: string[];
  openIssues?: number;
  size?: number;
}

export interface IRepoSafetyResult {
  repoUrl: string;
  meta?: IRepoSafetyMeta;
  riskScore: number;
  riskLevel: string;
  categories: IRepoSafetyCategory[];
  findings: IRepoSafetyFinding[];
  badges: IRepoSafetyBadge[];
  scannedAt?: string;
  commitSha?: string;
  filesScanned?: number;
  totalRepoFiles?: number;
  cached?: boolean;
}

export interface IRepoSafetyScan {
  progress: IRepoSafetyProgress[];
  result?: IRepoSafetyResult;
}

export interface IRepoGuardianCategoryScore {
  category: string;
  score: number;
}

export interface IRepoGuardianRuleResult {
  ruleId: string;
  ruleName: string;
  category: string;
  passed: boolean;
  details: string;
}

export interface IRepoGuardianRecommendation {
  ruleResultId: string;
  ruleId: string;
  issueDescription: string;
  explanation: string;
  suggestedFix: string;
}

export interface IRepoGuardianScanResult {
  scanRunId: string;
  status: string;
  overallScore: number;
  triggeredAt: string;
  completedAt: string;
  errorMessage: string | null;
  categoryScores: IRepoGuardianCategoryScore[];
  ruleResults: IRepoGuardianRuleResult[];
  recommendations: IRepoGuardianRecommendation[];
}

export interface IRepoGuardianScan {
  result?: IRepoGuardianScanResult;
}

export interface ICreateGithubRepositoryInput {
  name: string;
  description?: string;
  isPrivate?: boolean;
}

export interface ICreateProjectInput {
  title: string;
  description: string;
  maxMembers?: number;
  githubRepo?: string;
  difficulty: number;
  estimatedHoursPerWeek: number;
  skills: string[];
  type: number;
  status: number;
}

export interface IProjectJoinLoadWarning {
  shouldWarn: boolean;
  activeProjects: number;
  recommendedProjectLimit: number;
  currentWorkloadScore: number;
  proposedWorkloadScore: number;
  recommendedWorkloadLimit: number;
  message: string;
}

export interface IAiGeneratedProjectSpec {
  title: string;
  descriptionMarkdown: string;
  skills: string[];
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  estimatedHoursPerWeek: number;
}

export interface IRepositoryReadme {
  repoKey: string;
  content: string;
}

export interface IProjectMeeting {
  id: string;
  projectId: string;
  title: string;
  agenda: string;
  status: "requested" | "scheduled" | "completed" | "cancelled";
  startsAtUtc: string;
  endsAtUtc: string;
  jitsiRoomName: string;
  requestedByMemberId: string;
  requestedByMemberName: string;
  scheduledByMemberId: string;
  reminderMinutesBefore: number;
  reminderEnabled: boolean;
}

export interface IProjectStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  myProjects: IProject[];
  openProjects: IProject[];
  selectedProject?: IProject;
  lastMatch?: IProjectMatchResult;
}

export interface IProjectActionContext {
  fetchMyProjects: () => Promise<void>;
  fetchOpenProjects: () => Promise<void>;
  fetchProjectById: (projectId: string) => Promise<IProject | undefined>;
  getGithubConnectionStatus: () => Promise<IGithubConnectionStatus>;
  getMyGithubRepositories: () => Promise<IGithubRepository[]>;
  createGithubRepository: (
    input: ICreateGithubRepositoryInput,
  ) => Promise<IGithubRepository | undefined>;
  getRepositoryReadme: (repoKey: string) => Promise<IRepositoryReadme | undefined>;
  aiGenerateProjectSpec: (
    prompt: string,
    repoNameHint?: string,
  ) => Promise<IAiGeneratedProjectSpec | undefined>;
  createProject: (input: ICreateProjectInput) => Promise<IProject | undefined>;
  getJoinProjectLoadWarning: (
    projectId: string,
  ) => Promise<IProjectJoinLoadWarning | undefined>;
  joinProject: (
    projectId: string,
    confirmHighWorkload?: boolean,
  ) => Promise<IProject | undefined>;
  leaveProject: (projectId: string, reason: string) => Promise<IProject | undefined>;
  deleteProject: (projectId: string) => Promise<void>;
  removeProjectMember: (
    projectId: string,
    memberId: string,
    reason: string,
  ) => Promise<IProject | undefined>;
  submitProjectComplaint: (
    projectId: string,
    complaint: string,
  ) => Promise<void>;
  assignMemberRole: (
    projectId: string,
    memberId: string,
    role: "lead" | "member",
  ) => Promise<IProject | undefined>;
  aiMatchProject: () => Promise<IProject | undefined>;
  aiFillTeam: (projectId: string) => Promise<IProject | undefined>;
  aiGenerateProjectTasks: (
    projectId: string,
  ) => Promise<IProjectTask[]>;
  addProjectTask: (
    projectId: string,
    input: { title: string; description?: string; assignedMemberId?: string },
  ) => Promise<IProjectTask | undefined>;
  updateProjectTaskStatus: (
    projectId: string,
    taskId: string,
    status: "todo" | "in-progress" | "done",
  ) => Promise<IProjectTask | undefined>;
  updateProjectSkills: (
    projectId: string,
    skills: string[],
  ) => Promise<IProject | undefined>;
  completeProject: (projectId: string) => Promise<IProject | undefined>;
  scanRepoSafety: (projectId: string) => Promise<IRepoSafetyScan | undefined>;
  scanRepoSafetyByGithubUrl: (
    githubUrl: string,
  ) => Promise<IRepoSafetyScan | undefined>;
  scanRepoGuardian: (githubUrl: string) => Promise<IRepoGuardianScan | undefined>;
  getProjectMeetings: (projectId: string) => Promise<IProjectMeeting[]>;
  requestProjectMeeting: (
    projectId: string,
    input: {
      title: string;
      agenda?: string;
      startsAtUtc: string;
      endsAtUtc: string;
    },
  ) => Promise<IProjectMeeting | undefined>;
  scheduleProjectMeeting: (
    projectId: string,
    meetingId: string,
    input: {
      title: string;
      agenda?: string;
      startsAtUtc: string;
      endsAtUtc: string;
      jitsiRoomName?: string;
    },
  ) => Promise<IProjectMeeting | undefined>;
  setProjectMeetingReminder: (
    projectId: string,
    meetingId: string,
    minutesBefore: number,
    enabled: boolean,
  ) => Promise<IProjectMeeting | undefined>;
  cancelProjectMeeting: (
    projectId: string,
    meetingId: string,
  ) => Promise<IProjectMeeting | undefined>;
}

export const INITIAL_STATE: IProjectStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  myProjects: [],
  openProjects: [],
  selectedProject: undefined,
  lastMatch: undefined,
};

export const ProjectStateContext =
  createContext<IProjectStateContext>(INITIAL_STATE);

export const ProjectActionContext = createContext<IProjectActionContext>({
  fetchMyProjects: async () => undefined,
  fetchOpenProjects: async () => undefined,
  fetchProjectById: async () => undefined,
  getGithubConnectionStatus: async () => ({
    isConnected: false,
    githubUsername: "",
  }),
  getMyGithubRepositories: async () => [],
  createGithubRepository: async () => undefined,
  getRepositoryReadme: async () => undefined,
  aiGenerateProjectSpec: async () => undefined,
  createProject: async () => undefined,
  getJoinProjectLoadWarning: async () => undefined,
  joinProject: async () => undefined,
  leaveProject: async () => undefined,
  deleteProject: async () => undefined,
  removeProjectMember: async () => undefined,
  submitProjectComplaint: async () => undefined,
  assignMemberRole: async () => undefined,
  aiMatchProject: async () => undefined,
  aiFillTeam: async () => undefined,
  aiGenerateProjectTasks: async () => [],
  addProjectTask: async () => undefined,
  updateProjectTaskStatus: async () => undefined,
  updateProjectSkills: async () => undefined,
  completeProject: async () => undefined,
  scanRepoSafety: async () => undefined,
  scanRepoSafetyByGithubUrl: async () => undefined,
  scanRepoGuardian: async () => undefined,
  getProjectMeetings: async () => [],
  requestProjectMeeting: async () => undefined,
  scheduleProjectMeeting: async () => undefined,
  setProjectMeetingReminder: async () => undefined,
  cancelProjectMeeting: async () => undefined,
});
