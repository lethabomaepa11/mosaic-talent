import { describe, expect, it } from "vitest";
import {
  fetchMyProjectsSuccess,
  fetchOpenProjectsSuccess,
  leaveProjectPending,
} from "../actions";
import { INITIAL_STATE } from "../context";
import { ProjectReducer } from "../reducer";

const project = {
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
};

describe("ProjectReducer", () => {
  it("stores my projects", () => {
    const state = ProjectReducer(INITIAL_STATE, fetchMyProjectsSuccess([project]));
    expect(state.myProjects).toHaveLength(1);
    expect(state.myProjects[0].title).toBe("Project A");
  });

  it("stores open projects", () => {
    const state = ProjectReducer(INITIAL_STATE, fetchOpenProjectsSuccess([project]));
    expect(state.openProjects).toHaveLength(1);
    expect(state.openProjects[0].status).toBe("open");
  });

  it("sets pending state when leaving project", () => {
    const state = ProjectReducer(INITIAL_STATE, leaveProjectPending());
    expect(state.isPending).toBe(true);
  });
});
