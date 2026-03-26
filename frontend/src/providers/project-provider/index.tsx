"use client";

import { PropsWithChildren, useContext, useReducer } from "react";
import { AxiosError } from "axios";
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
  ICreateProjectInput,
  IProject,
  IProjectTask,
  INITIAL_STATE,
  ProjectActionContext,
  ProjectStateContext,
} from "./context";
import { ProjectReducer } from "./reducer";

const ENDPOINT = "/api/services/app/DeveloperProject";

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
          createProject,
          joinProject,
          aiMatchProject,
          aiFillTeam,
          addProjectTask,
          updateProjectTaskStatus,
          updateProjectSkills,
          completeProject,
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
