import { describe, expect, it } from "vitest";
import { buildReportSnapshotJson, parseOptionJson } from "../aiViz";

describe("reports ai viz helpers", () => {
  it("parses valid option json object", () => {
    const parsed = parseOptionJson('{"series":[{"type":"bar","data":[1,2]}]}');
    expect(parsed).not.toBeNull();
    expect(parsed?.series).toBeDefined();
  });

  it("returns null for invalid option json", () => {
    expect(parseOptionJson("")).toBeNull();
    expect(parseOptionJson("[]")).toBeNull();
    expect(parseOptionJson("{invalid")).toBeNull();
  });

  it("builds report snapshot json from dashboard metrics", () => {
    const json = buildReportSnapshotJson({
      totals: {
        totalApplications: 10,
        openPositions: 3,
        assessmentCompletion: 60.128,
        avgAssessmentTurnaround: 4.756,
        offerAcceptance: 22.991,
        shortlisted: 4,
        approved: 2,
      },
      trends: [{ monthLabel: "Jan", applications: 5, progressed: 3, hires: 1 }],
      pipeline: [{ key: "applied", label: "Applied", value: 10, percentage: 100 }],
      quality: {
        matchAvg: 71.224,
        assessmentAvg: 66.498,
        strongRate: 29.337,
        roleSpeed: [{ role: "Frontend", days: 3.888 }],
      },
      sources: [{ source: "linkedin", count: 8, percentage: 80 }],
    });

    const parsed = JSON.parse(json) as {
      totals: { assessmentCompletion: number };
      quality: { roleSpeed: Array<{ days: number }> };
    };
    expect(parsed.totals.assessmentCompletion).toBe(60.13);
    expect(parsed.quality.roleSpeed[0].days).toBe(3.89);
  });
});
