import { createAction } from "redux-actions";
import { IProject, IProjectStateContext } from "./context";

type ProjectStatePatch = Partial<IProjectStateContext>;

export enum ProjectStateEnums {
  PROJECT_FETCH_MY_PENDING = "PROJECT_FETCH_MY_PENDING",
  PROJECT_FETCH_MY_SUCCESS = "PROJECT_FETCH_MY_SUCCESS",
  PROJECT_FETCH_MY_ERROR = "PROJECT_FETCH_MY_ERROR",
  PROJECT_FETCH_OPEN_PENDING = "PROJECT_FETCH_OPEN_PENDING",
  PROJECT_FETCH_OPEN_SUCCESS = "PROJECT_FETCH_OPEN_SUCCESS",
  PROJECT_FETCH_OPEN_ERROR = "PROJECT_FETCH_OPEN_ERROR",
  PROJECT_FETCH_ONE_PENDING = "PROJECT_FETCH_ONE_PENDING",
  PROJECT_FETCH_ONE_SUCCESS = "PROJECT_FETCH_ONE_SUCCESS",
  PROJECT_FETCH_ONE_ERROR = "PROJECT_FETCH_ONE_ERROR",
  PROJECT_CREATE_PENDING = "PROJECT_CREATE_PENDING",
  PROJECT_CREATE_SUCCESS = "PROJECT_CREATE_SUCCESS",
  PROJECT_CREATE_ERROR = "PROJECT_CREATE_ERROR",
  PROJECT_JOIN_PENDING = "PROJECT_JOIN_PENDING",
  PROJECT_JOIN_SUCCESS = "PROJECT_JOIN_SUCCESS",
  PROJECT_JOIN_ERROR = "PROJECT_JOIN_ERROR",
  PROJECT_MATCH_PENDING = "PROJECT_MATCH_PENDING",
  PROJECT_MATCH_SUCCESS = "PROJECT_MATCH_SUCCESS",
  PROJECT_MATCH_ERROR = "PROJECT_MATCH_ERROR",
  PROJECT_FILL_TEAM_PENDING = "PROJECT_FILL_TEAM_PENDING",
  PROJECT_FILL_TEAM_SUCCESS = "PROJECT_FILL_TEAM_SUCCESS",
  PROJECT_FILL_TEAM_ERROR = "PROJECT_FILL_TEAM_ERROR",
  PROJECT_ADD_TASK_PENDING = "PROJECT_ADD_TASK_PENDING",
  PROJECT_ADD_TASK_SUCCESS = "PROJECT_ADD_TASK_SUCCESS",
  PROJECT_ADD_TASK_ERROR = "PROJECT_ADD_TASK_ERROR",
  PROJECT_UPDATE_TASK_PENDING = "PROJECT_UPDATE_TASK_PENDING",
  PROJECT_UPDATE_TASK_SUCCESS = "PROJECT_UPDATE_TASK_SUCCESS",
  PROJECT_UPDATE_TASK_ERROR = "PROJECT_UPDATE_TASK_ERROR",
  PROJECT_UPDATE_SKILLS_PENDING = "PROJECT_UPDATE_SKILLS_PENDING",
  PROJECT_UPDATE_SKILLS_SUCCESS = "PROJECT_UPDATE_SKILLS_SUCCESS",
  PROJECT_UPDATE_SKILLS_ERROR = "PROJECT_UPDATE_SKILLS_ERROR",
  PROJECT_COMPLETE_PENDING = "PROJECT_COMPLETE_PENDING",
  PROJECT_COMPLETE_SUCCESS = "PROJECT_COMPLETE_SUCCESS",
  PROJECT_COMPLETE_ERROR = "PROJECT_COMPLETE_ERROR",
}

export const fetchMyProjectsPending = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_FETCH_MY_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const fetchMyProjectsSuccess = createAction<
  ProjectStatePatch,
  IProject[]
>(ProjectStateEnums.PROJECT_FETCH_MY_SUCCESS, (myProjects) => ({
  isPending: false,
  isSuccess: true,
  isError: false,
  myProjects,
}));

export const fetchMyProjectsError = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_FETCH_MY_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const fetchOpenProjectsPending = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_FETCH_OPEN_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const fetchOpenProjectsSuccess = createAction<
  ProjectStatePatch,
  IProject[]
>(ProjectStateEnums.PROJECT_FETCH_OPEN_SUCCESS, (openProjects) => ({
  isPending: false,
  isSuccess: true,
  isError: false,
  openProjects,
}));

export const fetchOpenProjectsError = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_FETCH_OPEN_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const fetchProjectPending = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_FETCH_ONE_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const fetchProjectSuccess = createAction<ProjectStatePatch, IProject>(
  ProjectStateEnums.PROJECT_FETCH_ONE_SUCCESS,
  (selectedProject) => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    selectedProject,
  }),
);

export const fetchProjectError = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_FETCH_ONE_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const createProjectPending = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_CREATE_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const createProjectSuccess = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_CREATE_SUCCESS,
  () => ({ isPending: false, isSuccess: true, isError: false }),
);

export const createProjectError = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_CREATE_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const joinProjectPending = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_JOIN_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const joinProjectSuccess = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_JOIN_SUCCESS,
  () => ({ isPending: false, isSuccess: true, isError: false }),
);

export const joinProjectError = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_JOIN_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const aiMatchPending = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_MATCH_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const aiMatchSuccess = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_MATCH_SUCCESS,
  (project?: IProject) => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    lastMatch: project
      ? {
          projectId: project.id,
          projectTitle: project.title,
          insight: project.matchInsight,
          learningOutcomes: project.learningOutcomes ?? [],
        }
      : undefined,
  }),
);

export const aiMatchError = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_MATCH_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const aiFillTeamPending = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_FILL_TEAM_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const aiFillTeamSuccess = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_FILL_TEAM_SUCCESS,
  () => ({ isPending: false, isSuccess: true, isError: false }),
);

export const aiFillTeamError = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_FILL_TEAM_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const addTaskPending = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_ADD_TASK_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const addTaskSuccess = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_ADD_TASK_SUCCESS,
  () => ({ isPending: false, isSuccess: true, isError: false }),
);

export const addTaskError = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_ADD_TASK_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const updateTaskPending = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_UPDATE_TASK_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const updateTaskSuccess = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_UPDATE_TASK_SUCCESS,
  () => ({ isPending: false, isSuccess: true, isError: false }),
);

export const updateTaskError = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_UPDATE_TASK_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const updateSkillsPending = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_UPDATE_SKILLS_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const updateSkillsSuccess = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_UPDATE_SKILLS_SUCCESS,
  () => ({ isPending: false, isSuccess: true, isError: false }),
);

export const updateSkillsError = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_UPDATE_SKILLS_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const completeProjectPending = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_COMPLETE_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const completeProjectSuccess = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_COMPLETE_SUCCESS,
  () => ({ isPending: false, isSuccess: true, isError: false }),
);

export const completeProjectError = createAction<ProjectStatePatch>(
  ProjectStateEnums.PROJECT_COMPLETE_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);
