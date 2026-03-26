import { describe, expect, it } from "vitest";
import {
  fetchMyProjectsSuccess,
  fetchOpenProjectsSuccess,
  ProjectStateEnums,
} from "../actions";

const projects = [
  {
    id: "1",
    title: "Project A",
    description: "Desc",
    maxMembers: 4,
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
  });
});
