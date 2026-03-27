import { describe, expect, it } from "vitest";
import { fetchJobsSuccess } from "../actions";
import { INITIAL_STATE } from "../context";
import { JobReducer } from "../reducer";

const job = {
  id: "job-1",
  companyId: "company-1",
  title: "Frontend Engineer",
  description: "Build product UI.",
  location: "Remote",
  employmentType: "full-time",
  isOpen: true,
  createdAt: "2026-03-27T00:00:00Z",
  applicationCount: 0,
  applications: [],
};

describe("JobReducer", () => {
  it("stores jobs on fetch success", () => {
    const state = JobReducer(INITIAL_STATE, fetchJobsSuccess([job]));
    expect(state.jobs).toHaveLength(1);
    expect(state.jobs[0].title).toBe("Frontend Engineer");
  });
});
