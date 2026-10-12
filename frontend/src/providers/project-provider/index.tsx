"use client";

import { PropsWithChildren, useContext, useReducer } from "react";
import axios, { AxiosError } from "axios";
import { getAxiosInstance } from "@/utils/axiosInstance";
import {
  addTaskError,
  addTaskPending,
  addTaskSuccess,
  assignRoleError,
  assignRolePending,
  assignRoleSuccess,
  aiFillTeamError,
  aiFillTeamPending,
  aiFillTeamSuccess,
  aiMatchError,
  aiMatchPending,
  aiMatchSuccess,
  completeProjectError,
  completeProjectPending,
  completeProjectSuccess,
  createProjectError,
  createProjectPending,
  createProjectSuccess,
  deleteProjectError,
  deleteProjectPending,
  deleteProjectSuccess,
  removeProjectMemberError,
  removeProjectMemberPending,
  removeProjectMemberSuccess,
  submitComplaintError,
  submitComplaintPending,
  submitComplaintSuccess,
  fetchMyProjectsError,
  fetchMyProjectsPending,
  fetchMyProjectsSuccess,
  fetchOpenProjectsError,
  fetchOpenProjectsPending,
  fetchOpenProjectsSuccess,
  fetchProjectError,
  fetchProjectPending,
  fetchProjectSuccess,
  joinProjectError,
  joinProjectPending,
  joinProjectSuccess,
  leaveProjectError,
  leaveProjectPending,
  leaveProjectSuccess,
  updateTaskError,
  updateTaskPending,
  updateTaskSuccess,
  updateSkillsError,
  updateSkillsPending,
  updateSkillsSuccess,
} from "./actions";
import {
  IAiGeneratedProjectSpec,
  ICreateGithubRepositoryInput,
  ICreateProjectInput,
  IGithubConnectionStatus,
  IGithubRepository,
  IProject,
  IProjectJoinLoadWarning,
  IProjectInvite,
  IProjectMeeting,
  IProjectTask,
  IRepoSafetyBadge,
  IRepoSafetyCategory,
  IRepoSafetyFinding,
  IRepoSafetyMeta,
  IRepoSafetyProgress,
  IRepoSafetyResult,
  IRepoSafetyScan,
  IRepoGuardianScan,
  IRepoGuardianScanResult,
  IRepositoryReadme,
  INITIAL_STATE,
  ProjectActionContext,
  ProjectStateContext,
} from "./context";
import { ProjectReducer } from "./reducer";

const ENDPOINT = "/api/services/app/DeveloperProject";
const REPO_GUARDIAN_ENDPOINT =
  "https://fullstackproject-api.onrender.com/api/services/app/RepoGuardian/QuickScan";

const readApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.error?.message as string | undefined;
    return message || fallback;
  }

  return fallback;
};

const normalizeTask = (input: Partial<IProjectTask>): IProjectTask => ({
  id: String(input.id ?? ""),
  title: input.title ?? "",
  description: input.description ?? "",
  status: input.status ?? "todo",
  assignedMemberId: input.assignedMemberId ?? "",
  assignedMemberName: input.assignedMemberName ?? "",
});

const normalizeMemberRole = (role: string | undefined): "lead" | "member" =>
  role?.toLowerCase() === "lead" ? "lead" : "member";

const normalizeDifficulty = (
  difficulty: string | undefined,
): "beginner" | "intermediate" | "advanced" | "expert" => {
  const normalized = (difficulty ?? "").toLowerCase();
  if (
    normalized === "beginner" ||
    normalized === "intermediate" ||
    normalized === "advanced" ||
    normalized === "expert"
  ) {
    return normalized;
  }

  return "intermediate";
};

const normalizeProject = (input: Partial<IProject>): IProject => ({
  id: String(input.id ?? ""),
  title: input.title ?? "",
  description: input.description ?? "",
  maxMembers: Number(input.maxMembers ?? 4),
  difficulty: normalizeDifficulty(input.difficulty),
  estimatedHoursPerWeek: Number(input.estimatedHoursPerWeek ?? 6),
  workloadScore: Number(input.workloadScore ?? 0),
  githubRepo: input.githubRepo ?? "",
  skills: input.skills ?? [],
  type: input.type ?? "group",
  status: input.status ?? "open",
  ownerId: String(input.ownerId ?? ""),
  createdAt: input.createdAt ?? new Date().toISOString(),
  matchScore: Number(input.matchScore ?? 0),
  matchInsight: input.matchInsight ?? "",
  learningOutcomes: input.learningOutcomes ?? [],
  members: (input.members ?? []).map((member) => ({
    id: String(member.id ?? ""),
    name: member.name ?? "Developer",
    userName: member.userName ?? "",
    avatar: member.avatar ?? "",
    role: normalizeMemberRole(member.role),
  })),
  tasks: (input.tasks ?? []).map(normalizeTask),
});

const normalizeProjectList = (input: unknown): IProject[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((project) => normalizeProject(project as Partial<IProject>));
};

const normalizeGithubConnectionStatus = (
  input: Partial<IGithubConnectionStatus>,
): IGithubConnectionStatus => ({
  isConnected: Boolean(input.isConnected),
  githubUsername: input.githubUsername ?? "",
});

const normalizeGithubRepository = (
  input: Partial<IGithubRepository>,
): IGithubRepository => ({
  name: input.name ?? "",
  fullName: input.fullName ?? "",
  htmlUrl: input.htmlUrl ?? "",
  isPrivate: Boolean(input.isPrivate),
  defaultBranch: input.defaultBranch ?? "",
});

const normalizeGithubRepositoryList = (input: unknown): IGithubRepository[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((repo) =>
    normalizeGithubRepository(repo as Partial<IGithubRepository>),
  );
};

const normalizeRepoSafetyProgress = (
  input: Partial<IRepoSafetyProgress>,
): IRepoSafetyProgress => ({
  step: input.step ?? "",
  progress: Number(input.progress ?? 0),
});

const normalizeRepoSafetyFinding = (
  input: Partial<IRepoSafetyFinding>,
): IRepoSafetyFinding => ({
  ruleId: input.ruleId ?? "",
  category: input.category ?? "",
  severity: input.severity ?? "",
  title: input.title ?? "",
  description: input.description ?? "",
  filePath: input.filePath ?? "",
  points: input.points,
});

const normalizeRepoSafetyCategory = (
  input: Partial<IRepoSafetyCategory>,
): IRepoSafetyCategory => ({
  id: input.id ?? "",
  name: input.name ?? "",
  icon: input.icon ?? "",
  score: input.score,
  maxScore: input.maxScore,
  findings: (input.findings ?? []).map((finding) =>
    normalizeRepoSafetyFinding(finding),
  ),
});

const normalizeRepoSafetyBadge = (
  input: Partial<IRepoSafetyBadge>,
): IRepoSafetyBadge => ({
  type: input.type ?? "",
  label: input.label ?? "",
  description: input.description ?? "",
});

const normalizeRepoSafetyMeta = (
  input: Partial<IRepoSafetyMeta>,
): IRepoSafetyMeta => ({
  owner: input.owner ?? "",
  repo: input.repo ?? "",
  description: input.description ?? "",
  stars: input.stars,
  forks: input.forks,
  createdAt: input.createdAt ?? "",
  pushedAt: input.pushedAt ?? "",
  defaultBranch: input.defaultBranch ?? "",
  language: input.language ?? "",
  topics: input.topics ?? [],
  openIssues: input.openIssues,
  size: input.size,
});

const normalizeRepoSafetyResult = (
  input: Partial<IRepoSafetyResult>,
): IRepoSafetyResult => ({
  repoUrl: input.repoUrl ?? "",
  meta: input.meta ? normalizeRepoSafetyMeta(input.meta) : undefined,
  riskScore: Number(input.riskScore ?? 0),
  riskLevel: input.riskLevel ?? "",
  categories: (input.categories ?? []).map((category) =>
    normalizeRepoSafetyCategory(category),
  ),
  findings: (input.findings ?? []).map((finding) =>
    normalizeRepoSafetyFinding(finding),
  ),
  badges: (input.badges ?? []).map((badge) => normalizeRepoSafetyBadge(badge)),
  scannedAt: input.scannedAt ?? "",
  commitSha: input.commitSha ?? "",
  filesScanned: input.filesScanned,
  totalRepoFiles: input.totalRepoFiles,
  cached: input.cached,
});

const normalizeRepoSafetyScan = (
  input: Partial<IRepoSafetyScan>,
): IRepoSafetyScan => ({
  progress: (input.progress ?? []).map((step) => normalizeRepoSafetyProgress(step)),
  result: input.result ? normalizeRepoSafetyResult(input.result) : undefined,
});

const normalizeRepoGuardianScanResponse = (input: unknown): IRepoGuardianScan => {
  const data = input as { result?: IRepoGuardianScanResult };
  return {
    result: data.result,
  };
};

const normalizeJoinLoadWarning = (
  input: Partial<IProjectJoinLoadWarning>,
): IProjectJoinLoadWarning => ({
  shouldWarn: Boolean(input.shouldWarn),
  activeProjects: Number(input.activeProjects ?? 0),
  recommendedProjectLimit: Number(input.recommendedProjectLimit ?? 3),
  currentWorkloadScore: Number(input.currentWorkloadScore ?? 0),
  proposedWorkloadScore: Number(input.proposedWorkloadScore ?? 0),
  recommendedWorkloadLimit: Number(input.recommendedWorkloadLimit ?? 160),
  message: input.message ?? "",
});

const normalizeProjectSpec = (
  input: Partial<IAiGeneratedProjectSpec>,
): IAiGeneratedProjectSpec => ({
  title: input.title ?? "",
  descriptionMarkdown: input.descriptionMarkdown ?? "",
  skills: input.skills ?? [],
  difficulty: normalizeDifficulty(input.difficulty),
  estimatedHoursPerWeek: Number(input.estimatedHoursPerWeek ?? 6),
});

const normalizeRepositoryReadme = (
  input: Partial<IRepositoryReadme>,
): IRepositoryReadme => ({
  repoKey: input.repoKey ?? "",
  content: input.content ?? "",
});

const normalizeMeeting = (input: Partial<IProjectMeeting>): IProjectMeeting => ({
  id: input.id ?? "",
  projectId: input.projectId ?? "",
  title: input.title ?? "",
  agenda: input.agenda ?? "",
  status:
    input.status === "requested" ||
    input.status === "scheduled" ||
    input.status === "completed" ||
    input.status === "cancelled"
      ? input.status
      : "requested",
  startsAtUtc: input.startsAtUtc ?? "",
  endsAtUtc: input.endsAtUtc ?? "",
  jitsiRoomName: input.jitsiRoomName ?? "",
  requestedByMemberId: input.requestedByMemberId ?? "",
  requestedByMemberName: input.requestedByMemberName ?? "",
  scheduledByMemberId: input.scheduledByMemberId ?? "",
  reminderMinutesBefore: Number(input.reminderMinutesBefore ?? 15),
  reminderEnabled:
    typeof input.reminderEnabled === "boolean" ? input.reminderEnabled : true,
});

const normalizeMeetingList = (input: unknown): IProjectMeeting[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((meeting) => normalizeMeeting(meeting as Partial<IProjectMeeting>));
};

const normalizeProjectInvite = (
  input: Partial<IProjectInvite>,
): IProjectInvite => ({
  id: input.id ?? "",
  projectId: input.projectId ?? "",
  developerId: input.developerId ?? "",
  developerName: input.developerName ?? "",
  developerUserName: input.developerUserName ?? "",
  invitedByDeveloperId: input.invitedByDeveloperId ?? "",
  invitedByDeveloperName: input.invitedByDeveloperName ?? "",
  status:
    input.status === "accepted" ||
    input.status === "rejected" ||
    input.status === "pending"
      ? input.status
      : "pending",
  invitedAtUtc: input.invitedAtUtc ?? "",
  respondedAtUtc: input.respondedAtUtc ?? "",
});

const normalizeProjectInviteList = (input: unknown): IProjectInvite[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((invite) =>
    normalizeProjectInvite(invite as Partial<IProjectInvite>),
  );
};

export const ProjectProvider = ({ children }: PropsWithChildren) => {
  const instance = getAxiosInstance();
  const [state, dispatch] = useReducer(ProjectReducer, INITIAL_STATE);

  const fetchMyProjects = async () => {
    dispatch(fetchMyProjectsPending());

    try {
      const res = await instance.get(`${ENDPOINT}/GetMyProjects`);
      dispatch(fetchMyProjectsSuccess(normalizeProjectList(res.data?.result)));
    } catch {
      dispatch(fetchMyProjectsError());
    }
  };

  const fetchOpenProjects = async () => {
    dispatch(fetchOpenProjectsPending());

    try {
      const res = await instance.get(`${ENDPOINT}/GetOpenProjects`);
      const projects = normalizeProjectList(res.data?.result);
      dispatch(fetchOpenProjectsSuccess(projects));
      return projects;
    } catch {
      dispatch(fetchOpenProjectsError());
      return [];
    }
  };

  const fetchProjectById = async (projectId: string) => {
    dispatch(fetchProjectPending());

    try {
      const res = await instance.get(`${ENDPOINT}/GetProject`, {
        params: {
          projectId,
          ProjectId: projectId,
          "input.projectId": projectId,
        },
      });
      const project = normalizeProject((res.data?.result ?? {}) as Partial<IProject>);
      dispatch(fetchProjectSuccess(project));
      return project;
    } catch (error) {
      dispatch(fetchProjectError());
      throw new Error(readApiErrorMessage(error, "Failed to load project."));
    }
  };

  const getGithubConnectionStatus = async () => {
    try {
      const res = await instance.get(`${ENDPOINT}/GetGithubConnectionStatus`);
      return normalizeGithubConnectionStatus(
        (res.data?.result ?? {}) as Partial<IGithubConnectionStatus>,
      );
    } catch (error) {
      throw new Error(
        readApiErrorMessage(error, "Failed to load GitHub connection status."),
      );
    }
  };

  const getMyGithubRepositories = async () => {
    try {
      const res = await instance.get(`${ENDPOINT}/GetMyGithubRepositories`);
      return normalizeGithubRepositoryList(res.data?.result);
    } catch (error) {
      throw new Error(
        readApiErrorMessage(error, "Failed to load GitHub repositories."),
      );
    }
  };

  const createGithubRepository = async (input: ICreateGithubRepositoryInput) => {
    try {
      const res = await instance.post(`${ENDPOINT}/CreateGithubRepository`, input);
      return normalizeGithubRepository(
        (res.data?.result ?? {}) as Partial<IGithubRepository>,
      );
    } catch (error) {
      throw new Error(
        readApiErrorMessage(error, "Failed to create GitHub repository."),
      );
    }
  };

  const getRepositoryReadme = async (repoKey: string) => {
    try {
      const res = await instance.get(`${ENDPOINT}/GetRepositoryReadme`, {
        params: { githubRepo: repoKey },
      });
      return normalizeRepositoryReadme(
        (res.data?.result ?? {}) as Partial<IRepositoryReadme>,
      );
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to load repository README."));
    }
  };

  const aiGenerateProjectSpec = async (prompt: string, repoNameHint?: string) => {
    try {
      const res = await instance.post(`${ENDPOINT}/AiGenerateProjectSpec`, {
        prompt,
        repoNameHint,
      });
      return normalizeProjectSpec(
        (res.data?.result ?? {}) as Partial<IAiGeneratedProjectSpec>,
      );
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to generate project spec."));
    }
  };

  const createProject = async (input: ICreateProjectInput) => {
    dispatch(createProjectPending());

    try {
      const res = await instance.post(`${ENDPOINT}/CreateProject`, input);
      const project = normalizeProject((res.data?.result ?? {}) as Partial<IProject>);
      dispatch(createProjectSuccess());
      await Promise.all([fetchMyProjects(), fetchOpenProjects()]);
      return project;
    } catch (error) {
      dispatch(createProjectError());
      throw new Error(readApiErrorMessage(error, "Failed to create project."));
    }
  };

  const getJoinProjectLoadWarning = async (projectId: string) => {
    try {
      const res = await instance.get(`${ENDPOINT}/GetJoinProjectLoadWarning`, {
        params: { projectId },
      });
      return normalizeJoinLoadWarning(
        (res.data?.result ?? {}) as Partial<IProjectJoinLoadWarning>,
      );
    } catch (error) {
      throw new Error(
        readApiErrorMessage(error, "Failed to assess project workload."),
      );
    }
  };

  const joinProject = async (projectId: string, confirmHighWorkload = false) => {
    dispatch(joinProjectPending());

    try {
      const res = await instance.post(`${ENDPOINT}/JoinProject`, {
        projectId,
        confirmHighWorkload,
      });
      const project = normalizeProject((res.data?.result ?? {}) as Partial<IProject>);
      dispatch(joinProjectSuccess());
      await Promise.all([fetchMyProjects(), fetchOpenProjects()]);
      return project;
    } catch (error) {
      dispatch(joinProjectError());
      throw new Error(readApiErrorMessage(error, "Failed to join project."));
    }
  };

  const leaveProject = async (projectId: string, reason: string) => {
    dispatch(leaveProjectPending());

    try {
      const res = await instance.post(`${ENDPOINT}/LeaveProject`, {
        projectId,
        reason,
      });
      const project = normalizeProject((res.data?.result ?? {}) as Partial<IProject>);
      dispatch(leaveProjectSuccess());
      await Promise.all([fetchMyProjects(), fetchOpenProjects()]);
      return project;
    } catch (error) {
      dispatch(leaveProjectError());
      throw new Error(readApiErrorMessage(error, "Failed to leave project."));
    }
  };

  const deleteProject = async (projectId: string) => {
    dispatch(deleteProjectPending());

    try {
      await instance.delete(`${ENDPOINT}/DeleteProject`, {
        params: { projectId },
      });
      dispatch(deleteProjectSuccess());
      await Promise.all([fetchMyProjects(), fetchOpenProjects()]);
    } catch (error) {
      dispatch(deleteProjectError());
      throw new Error(readApiErrorMessage(error, "Failed to delete project."));
    }
  };

  const removeProjectMember = async (
    projectId: string,
    memberId: string,
    reason: string,
  ) => {
    dispatch(removeProjectMemberPending());

    try {
      const res = await instance.post(`${ENDPOINT}/RemoveProjectMember`, {
        projectId,
        memberId,
        reason,
      });
      const project = normalizeProject((res.data?.result ?? {}) as Partial<IProject>);
      dispatch(removeProjectMemberSuccess());
      dispatch(fetchProjectSuccess(project));
      await Promise.all([fetchMyProjects(), fetchOpenProjects()]);
      return project;
    } catch (error) {
      dispatch(removeProjectMemberError());
      throw new Error(readApiErrorMessage(error, "Failed to remove member."));
    }
  };

  const submitProjectComplaint = async (projectId: string, complaint: string) => {
    dispatch(submitComplaintPending());

    try {
      await instance.post(`${ENDPOINT}/SubmitProjectComplaint`, {
        projectId,
        complaint,
      });
      dispatch(submitComplaintSuccess());
    } catch (error) {
      dispatch(submitComplaintError());
      throw new Error(readApiErrorMessage(error, "Failed to submit complaint."));
    }
  };

  const assignMemberRole = async (
    projectId: string,
    memberId: string,
    role: "lead" | "member",
  ) => {
    dispatch(assignRolePending());

    try {
      const res = await instance.put(`${ENDPOINT}/AssignMemberRole`, {
        projectId,
        memberId,
        role,
      });
      const project = normalizeProject((res.data?.result ?? {}) as Partial<IProject>);
      dispatch(assignRoleSuccess());
      dispatch(fetchProjectSuccess(project));
      await Promise.all([fetchMyProjects(), fetchOpenProjects()]);
      return project;
    } catch (error) {
      dispatch(assignRoleError());
      throw new Error(readApiErrorMessage(error, "Failed to update member role."));
    }
  };

  const aiMatchProject = async () => {
    dispatch(aiMatchPending());

    try {
      const res = await instance.post(`${ENDPOINT}/AiMatchProject`);
      const project = res.data?.result
        ? normalizeProject((res.data.result ?? {}) as Partial<IProject>)
        : undefined;
      dispatch(aiMatchSuccess(project));
      await Promise.all([fetchMyProjects(), fetchOpenProjects()]);
      return project;
    } catch (error) {
      dispatch(aiMatchError());
      throw new Error(readApiErrorMessage(error, "AI match failed."));
    }
  };

  const aiFillTeam = async (projectId: string) => {
    dispatch(aiFillTeamPending());

    try {
      const res = await instance.post(`${ENDPOINT}/AiFillTeam`, { projectId });
      const project = normalizeProject((res.data?.result ?? {}) as Partial<IProject>);
      dispatch(aiFillTeamSuccess());
      dispatch(fetchProjectSuccess(project));
      await Promise.all([fetchMyProjects(), fetchOpenProjects()]);
      return project;
    } catch (error) {
      dispatch(aiFillTeamError());
      throw new Error(readApiErrorMessage(error, "Failed to fill team."));
    }
  };

  const aiGenerateProjectTasks = async (
    projectId: string,
    repoAnalysisSummary?: string,
  ) => {
    dispatch(addTaskPending());
    try {
      const res = await instance.post(`${ENDPOINT}/AiGenerateProjectTasks`, {
        projectId,
        repoAnalysisSummary,
      });
      const tasks = Array.isArray(res.data?.result)
        ? (res.data.result as Array<Partial<IProjectTask>>).map(normalizeTask)
        : [];
      dispatch(addTaskSuccess());
      await fetchProjectById(projectId);
      return tasks;
    } catch (error) {
      dispatch(addTaskError());
      throw new Error(readApiErrorMessage(error, "Failed to generate AI tasks."));
    }
  };

  const addProjectTask = async (
    projectId: string,
    input: { title: string; description?: string; assignedMemberId?: string },
  ) => {
    dispatch(addTaskPending());

    try {
      const res = await instance.post(`${ENDPOINT}/AddProjectTask`, {
        projectId,
        title: input.title,
        description: input.description,
        assignedMemberId: input.assignedMemberId || undefined,
      });
      const task = normalizeTask((res.data?.result ?? {}) as Partial<IProjectTask>);
      dispatch(addTaskSuccess());
      await fetchProjectById(projectId);
      return task;
    } catch (error) {
      dispatch(addTaskError());
      throw new Error(readApiErrorMessage(error, "Failed to add task."));
    }
  };

  const reassignProjectTask = async (
    projectId: string,
    taskId: string,
    assignedMemberId?: string,
  ) => {
    dispatch(updateTaskPending());

    try {
      const res = await instance.post(`${ENDPOINT}/ReassignProjectTask`, {
        projectId,
        taskId,
        assignedMemberId: assignedMemberId || undefined,
      });
      const task = normalizeTask((res.data?.result ?? {}) as Partial<IProjectTask>);
      dispatch(updateTaskSuccess());
      await fetchProjectById(projectId);
      return task;
    } catch (error) {
      dispatch(updateTaskError());
      throw new Error(readApiErrorMessage(error, "Failed to reassign task."));
    }
  };

  const updateProjectTaskStatus = async (
    projectId: string,
    taskId: string,
    status: "todo" | "in-progress" | "done",
  ) => {
    dispatch(updateTaskPending());

    try {
      const res = await instance.put(`${ENDPOINT}/UpdateProjectTaskStatus`, {
        projectId,
        taskId,
        status,
      });
      const task = normalizeTask((res.data?.result ?? {}) as Partial<IProjectTask>);
      dispatch(updateTaskSuccess());
      await fetchProjectById(projectId);
      return task;
    } catch (error) {
      dispatch(updateTaskError());
      throw new Error(readApiErrorMessage(error, "Failed to update task."));
    }
  };

  const completeProject = async (projectId: string) => {
    dispatch(completeProjectPending());

    try {
      const res = await instance.post(`${ENDPOINT}/CompleteProject`, { projectId });
      const project = normalizeProject((res.data?.result ?? {}) as Partial<IProject>);
      dispatch(completeProjectSuccess());
      dispatch(fetchProjectSuccess(project));
      await Promise.all([fetchMyProjects(), fetchOpenProjects()]);
      return project;
    } catch (error) {
      dispatch(completeProjectError());
      throw new Error(readApiErrorMessage(error, "Failed to complete project."));
    }
  };

  const getProjectInvites = async (projectId: string) => {
    try {
      const res = await instance.get(`${ENDPOINT}/GetProjectInvites`, {
        params: { projectId },
      });
      return normalizeProjectInviteList(res.data?.result);
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to load project invites."));
    }
  };

  const acceptProjectInvite = async (projectId: string, inviteId: string) => {
    try {
      const res = await instance.post(`${ENDPOINT}/AcceptProjectInvite`, {
        projectId,
        inviteId,
      });
      await Promise.all([fetchMyProjects(), fetchOpenProjects()]);
      return normalizeProjectInvite(
        (res.data?.result ?? {}) as Partial<IProjectInvite>,
      );
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to accept project invite."));
    }
  };

  const rejectProjectInvite = async (
    projectId: string,
    inviteId: string,
    reason?: string,
  ) => {
    try {
      const res = await instance.post(`${ENDPOINT}/RejectProjectInvite`, {
        projectId,
        inviteId,
        reason,
      });
      await Promise.all([fetchMyProjects(), fetchOpenProjects()]);
      return normalizeProjectInvite(
        (res.data?.result ?? {}) as Partial<IProjectInvite>,
      );
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to reject project invite."));
    }
  };

  const scanRepoSafety = async (projectId: string) => {
    try {
      const res = await instance.post(`${ENDPOINT}/ScanRepoSafety`, { projectId });
      return normalizeRepoSafetyScan(
        (res.data?.result ?? {}) as Partial<IRepoSafetyScan>,
      );
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Repo safety scan failed."));
    }
  };

  const scanRepoSafetyByGithubUrl = async (githubUrl: string) => {
    try {
      const res = await instance.post(`${ENDPOINT}/ScanRepoSafetyByUrl`, {
        githubUrl,
      });
      return normalizeRepoSafetyScan(
        (res.data?.result ?? {}) as Partial<IRepoSafetyScan>,
      );
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Repo safety scan failed."));
    }
  };

  const scanRepoGuardian = async (githubUrl: string) => {
    try {
      const res = await axios.post(REPO_GUARDIAN_ENDPOINT, { githubUrl });
      return normalizeRepoGuardianScanResponse(res.data);
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Repo guardian scan failed."));
    }
  };

  const getProjectMeetings = async (projectId: string) => {
    try {
      const res = await instance.get(`${ENDPOINT}/GetProjectMeetings`, {
        params: { projectId },
      });
      return normalizeMeetingList(res.data?.result);
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to load project meetings."));
    }
  };

  const requestProjectMeeting = async (
    projectId: string,
    input: { title: string; agenda?: string; startsAtUtc: string; endsAtUtc: string },
  ) => {
    try {
      const res = await instance.post(`${ENDPOINT}/RequestProjectMeeting`, {
        projectId,
        title: input.title,
        agenda: input.agenda,
        startsAtUtc: input.startsAtUtc,
        endsAtUtc: input.endsAtUtc,
      });
      return normalizeMeeting((res.data?.result ?? {}) as Partial<IProjectMeeting>);
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to request project meeting."));
    }
  };

  const scheduleProjectMeeting = async (
    projectId: string,
    meetingId: string,
    input: {
      title: string;
      agenda?: string;
      startsAtUtc: string;
      endsAtUtc: string;
      jitsiRoomName?: string;
    },
  ) => {
    try {
      const res = await instance.post(`${ENDPOINT}/ScheduleProjectMeeting`, {
        projectId,
        meetingId,
        title: input.title,
        agenda: input.agenda,
        startsAtUtc: input.startsAtUtc,
        endsAtUtc: input.endsAtUtc,
        jitsiRoomName: input.jitsiRoomName,
      });
      return normalizeMeeting((res.data?.result ?? {}) as Partial<IProjectMeeting>);
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to schedule meeting."));
    }
  };

  const setProjectMeetingReminder = async (
    projectId: string,
    meetingId: string,
    minutesBefore: number,
    enabled: boolean,
  ) => {
    try {
      const res = await instance.post(`${ENDPOINT}/SetProjectMeetingReminder`, {
        projectId,
        meetingId,
        minutesBefore,
        enabled,
      });
      return normalizeMeeting((res.data?.result ?? {}) as Partial<IProjectMeeting>);
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to save meeting reminder."));
    }
  };

  const cancelProjectMeeting = async (projectId: string, meetingId: string) => {
    try {
      const res = await instance.post(`${ENDPOINT}/CancelProjectMeeting`, {
        projectId,
        meetingId,
      });
      return normalizeMeeting((res.data?.result ?? {}) as Partial<IProjectMeeting>);
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to cancel meeting."));
    }
  };

  const updateProjectSkills = async (projectId: string, skills: string[]) => {
    dispatch(updateSkillsPending());

    try {
      const res = await instance.put(`${ENDPOINT}/UpdateProjectSkills`, {
        projectId,
        skills,
      });
      const project = normalizeProject((res.data?.result ?? {}) as Partial<IProject>);
      dispatch(updateSkillsSuccess());
      dispatch(fetchProjectSuccess(project));
      await Promise.all([fetchMyProjects(), fetchOpenProjects()]);
      return project;
    } catch (error) {
      dispatch(updateSkillsError());
      throw new Error(readApiErrorMessage(error, "Failed to update project skills."));
    }
  };

  return (
    <ProjectStateContext.Provider value={state}>
      <ProjectActionContext.Provider
        value={{
          fetchMyProjects,
          fetchOpenProjects,
          fetchProjectById,
          getGithubConnectionStatus,
          getMyGithubRepositories,
          createGithubRepository,
          getRepositoryReadme,
          aiGenerateProjectSpec,
          createProject,
          getJoinProjectLoadWarning,
          joinProject,
          leaveProject,
          deleteProject,
          removeProjectMember,
          submitProjectComplaint,
          assignMemberRole,
          aiMatchProject,
          aiFillTeam,
          aiGenerateProjectTasks,
          addProjectTask,
          reassignProjectTask,
          updateProjectTaskStatus,
          updateProjectSkills,
          completeProject,
          getProjectInvites,
          acceptProjectInvite,
          rejectProjectInvite,
          scanRepoSafety,
          scanRepoSafetyByGithubUrl,
          scanRepoGuardian,
          getProjectMeetings,
          requestProjectMeeting,
          scheduleProjectMeeting,
          setProjectMeetingReminder,
          cancelProjectMeeting,
        }}
      >
        {children}
      </ProjectActionContext.Provider>
    </ProjectStateContext.Provider>
  );
};

export const useProjectState = () => {
  return useContext(ProjectStateContext);
};

export const useProjectAction = () => {
  return useContext(ProjectActionContext);
};
