import { describe, expect, it } from "vitest";
import {
  deleteProjectPending,
  deleteProjectSuccess,
  fetchMyProjectsSuccess,
  fetchOpenProjectsSuccess,
  leaveProjectPending,
  ProjectStateEnums,
  removeProjectMemberPending,
  submitComplaintPending,
} from "../actions";
import type { IProject } from "../context";

const projects: IProject[] = [
  {
    id: "1",
    title: "Project A",
    description: "Desc",
    maxMembers: 4,
    difficulty: "intermediate",
    estimatedHoursPerWeek: 8,
    workloadScore: 108,
    githubRepo: "",
    skills: [],
    type: "group",
    status: "open",
    ownerId: "owner",
    createdAt: "2026-03-26T00:00:00Z",
    members: [],
    tasks: [],
  },
];

describe("project actions", () => {
  it("creates fetch my/open success payloads", () => {
    expect(fetchMyProjectsSuccess(projects)).toMatchObject({
      type: ProjectStateEnums.PROJECT_FETCH_MY_SUCCESS,
      payload: {
        myProjects: projects,
      },
    });

    expect(fetchOpenProjectsSuccess(projects)).toMatchObject({
      type: ProjectStateEnums.PROJECT_FETCH_OPEN_SUCCESS,
      payload: {
        openProjects: projects,
      },
    });

    expect(leaveProjectPending()).toMatchObject({
      type: ProjectStateEnums.PROJECT_LEAVE_PENDING,
      payload: {
        isPending: true,
      },
    });

    expect(deleteProjectPending()).toMatchObject({
      type: ProjectStateEnums.PROJECT_DELETE_PENDING,
      payload: {
        isPending: true,
      },
    });

    expect(deleteProjectSuccess()).toMatchObject({
      type: ProjectStateEnums.PROJECT_DELETE_SUCCESS,
      payload: {
        isSuccess: true,
      },
    });

    expect(removeProjectMemberPending()).toMatchObject({
      type: ProjectStateEnums.PROJECT_REMOVE_MEMBER_PENDING,
      payload: {
        isPending: true,
      },
    });

    expect(submitComplaintPending()).toMatchObject({
      type: ProjectStateEnums.PROJECT_COMPLAINT_PENDING,
      payload: {
        isPending: true,
      },
    });
  });
});
