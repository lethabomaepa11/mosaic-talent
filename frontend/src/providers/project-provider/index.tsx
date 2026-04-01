"use client";

import { PropsWithChildren, useContext, useReducer } from "react";
import axios, { AxiosError } from "axios";
import { getAxiosInstance } from "@/utils/axiosInstance";
import {
  addTaskError,
  addTaskPending,
  addTaskSuccess,
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
  updateTaskError,
  updateTaskPending,
  updateTaskSuccess,
  updateSkillsError,
  updateSkillsPending,
  updateSkillsSuccess,
} from "./actions";
import {
  ICreateGithubRepositoryInput,
  ICreateProjectInput,
  IGithubConnectionStatus,
  IGithubRepository,
  IProject,
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
  INITIAL_STATE,
  ProjectActionContext,
  ProjectStateContext,
} from "./context";
import { ProjectReducer } from "./reducer";

const ENDPOINT = "/api/services/app/DeveloperProject";
const REPO_GUARDIAN_ENDPOINT = "https://fullstackproject-api.onrender.com/api/services/app/RepoGuardian/QuickScan";

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
});

const normalizeProject = (input: Partial<IProject>): IProject => ({
  id: String(input.id ?? ""),
  title: input.title ?? "",
  description: input.description ?? "",
  maxMembers: Number(input.maxMembers ?? 4),
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
    role: member.role ?? "member",
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

  return input.map((repo) => normalizeGithubRepository(repo as Partial<IGithubRepository>));
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

const normalizeRepoSafetyScan = (input: Partial<IRepoSafetyScan>): IRepoSafetyScan => ({
  progress: (input.progress ?? []).map((step) =>
    normalizeRepoSafetyProgress(step),
  ),
  result: input.result ? normalizeRepoSafetyResult(input.result) : undefined,
});

const normalizeRepoGuardianScan = (input: Partial<IRepoGuardianScan>): IRepoGuardianScan => ({
  result: input.result,
});

const normalizeRepoGuardianScanResponse = (input: unknown): IRepoGuardianScan => {
  const data = input as { result?: IRepoGuardianScanResult };
  return {
    result: data.result,
  };
};

export const ProjectProvider = ({ children }: PropsWithChildren) => {
  const instance = getAxiosInstance();
  const [state, dispatch] = useReducer(ProjectReducer, INITIAL_STATE);

  const fetchMyProjects = async () => {
    dispatch(fetchMyProjectsPending());

    try {
      const res = await instance.get(`${ENDPOINT}/GetMyProjects`);
      const projects = normalizeProjectList(res.data?.result);
      dispatch(fetchMyProjectsSuccess(projects));
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
    } catch {
      dispatch(fetchOpenProjectsError());
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

  const joinProject = async (projectId: string) => {
    dispatch(joinProjectPending());

    try {
      const res = await instance.post(`${ENDPOINT}/JoinProject`, { projectId });
      const project = normalizeProject((res.data?.result ?? {}) as Partial<IProject>);
      dispatch(joinProjectSuccess());
      await Promise.all([fetchMyProjects(), fetchOpenProjects()]);
      return project;
    } catch (error) {
      dispatch(joinProjectError());
      throw new Error(readApiErrorMessage(error, "Failed to join project."));
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

  const addProjectTask = async (
    projectId: string,
    input: { title: string; description?: string },
  ) => {
    dispatch(addTaskPending());

    try {
      const res = await instance.post(`${ENDPOINT}/AddProjectTask`, {
        projectId,
        title: input.title,
        description: input.description,
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
      const res = await axios.post(REPO_GUARDIAN_ENDPOINT, {
        githubUrl,
      });
      return normalizeRepoGuardianScanResponse(res.data);
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Repo guardian scan failed."));
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
          createProject,
          joinProject,
          aiMatchProject,
          aiFillTeam,
          addProjectTask,
          updateProjectTaskStatus,
          updateProjectSkills,
          completeProject,
          scanRepoSafety,
          scanRepoSafetyByGithubUrl,
          scanRepoGuardian,
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
