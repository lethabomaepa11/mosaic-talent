import { describe, expect, it } from "vitest";
import { JobStateEnums, fetchJobsSuccess } from "../actions";

const jobs = [
  {
    id: "job-1",
    companyId: "company-1",
    companyName: "Acme",
    companyLogoStoredFileId: "",
    title: "Frontend Engineer",
    description: "Build product UI.",
    location: "Remote",
    employmentType: "full-time",
    isOpen: true,
    createdAt: "2026-03-27T00:00:00Z",
    applicationCount: 0,
    applications: [],
  },
];

describe("job actions", () => {
  it("creates fetch jobs success payload", () => {
    expect(fetchJobsSuccess(jobs)).toMatchObject({
      type: JobStateEnums.JOB_FETCH_ALL_SUCCESS,
      payload: {
        jobs,
      },
    });
  });
});
