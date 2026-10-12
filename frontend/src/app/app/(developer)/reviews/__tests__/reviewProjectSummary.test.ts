import { describe, expect, it } from "vitest";
import { toReviewProjectSummary } from "../reviewProjectSummary";

describe("toReviewProjectSummary", () => {
  it("computes pending and completed counts", () => {
    const summary = toReviewProjectSummary({
      projectId: "project-1",
      projectTitle: "Project One",
      projectStatus: "in-progress",
      canRequestPeerReview: true,
      peerReviewRequestMessage: "",
      assignedToMe: [
        {
          id: "r-1",
          projectId: "project-1",
          projectTitle: "Project One",
          reviewerDeveloperId: "dev-a",
          reviewerName: "Anonymous teammate",
          revieweeDeveloperId: "dev-b",
          revieweeName: "Anonymous teammate",
          rating: 5,
          isCompleted: false,
          questions: [],
        },
        {
          id: "r-2",
          projectId: "project-1",
          projectTitle: "Project One",
          reviewerDeveloperId: "dev-a",
          reviewerName: "Anonymous teammate",
          revieweeDeveloperId: "dev-c",
          revieweeName: "Anonymous teammate",
          rating: 8,
          isCompleted: true,
          questions: [],
        },
      ],
      receivedByMe: [],
      feedback: undefined,
    });

    expect(summary.pendingCount).toBe(1);
    expect(summary.completedCount).toBe(1);
  });
});
