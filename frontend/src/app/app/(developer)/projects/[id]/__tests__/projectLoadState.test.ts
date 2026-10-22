import { describe, expect, it } from "vitest";
import { resolveProjectDetailViewState } from "../projectLoadState";

describe("resolveProjectDetailViewState", () => {
  it("returns loading while project request is in flight", () => {
    const state = resolveProjectDetailViewState({
      isProjectLoading: true,
      projectId: "abc123",
      project: undefined,
    });

    expect(state).toBe("loading");
  });

  it("returns not-found when request finishes with no project", () => {
    const state = resolveProjectDetailViewState({
      isProjectLoading: false,
      projectId: "abc123",
      project: undefined,
    });

    expect(state).toBe("not-found");
  });

  it("returns not-found when selected project differs from route id", () => {
    const state = resolveProjectDetailViewState({
      isProjectLoading: false,
      projectId: "abc123",
      project: {
        id: "other-id",
        title: "",
        description: "",
        problemStatement: "",
        isPublic: true,
        maxMembers: 4,
        difficulty: "intermediate",
        estimatedHoursPerWeek: 6,
        workloadScore: 0,
        githubRepo: "",
        skills: [],
        type: "group",
        status: "open",
        ownerId: "",
        createdAt: "",
        members: [],
        tasks: [],
      },
    });

    expect(state).toBe("not-found");
  });

  it("returns ready when selected project matches route id", () => {
    const state = resolveProjectDetailViewState({
      isProjectLoading: false,
      projectId: "abc123",
      project: {
        id: "abc123",
        title: "",
        description: "",
        problemStatement: "",
        isPublic: true,
        maxMembers: 4,
        difficulty: "intermediate",
        estimatedHoursPerWeek: 6,
        workloadScore: 0,
        githubRepo: "",
        skills: [],
        type: "group",
        status: "open",
        ownerId: "",
        createdAt: "",
        members: [],
        tasks: [],
      },
    });

    expect(state).toBe("ready");
  });
});
