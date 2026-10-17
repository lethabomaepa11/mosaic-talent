import { describe, expect, it } from "vitest";
import { isCompletedProject, splitProjectsByStatus } from "../projectSections";

describe("projectSections", () => {
  it("identifies both supported completed statuses without case sensitivity", () => {
    expect(isCompletedProject({ status: "Completed" })).toBe(true);
    expect(isCompletedProject({ status: "complete" })).toBe(true);
    expect(isCompletedProject({ status: "in-progress" })).toBe(false);
  });

  it("splits projects into active and completed groups", () => {
    const projects = [
      { id: "1", status: "open" },
      { id: "2", status: "completed" },
      { id: "3", status: "in-progress" },
    ];

    expect(splitProjectsByStatus(projects)).toEqual({
      active: [projects[0], projects[2]],
      completed: [projects[1]],
    });
  });
});
