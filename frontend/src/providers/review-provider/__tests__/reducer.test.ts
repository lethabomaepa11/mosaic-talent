import { describe, expect, it } from "vitest";
import { fetchMyReviewsSuccess, fetchProjectReviewSuccess } from "../actions";
import { INITIAL_STATE } from "../context";
import { ReviewReducer } from "../reducer";

const projectReview = {
  projectId: "project-1",
  projectTitle: "Project One",
  assignedToMe: [],
  receivedByMe: [],
};

describe("ReviewReducer", () => {
  it("stores project review list", () => {
    const state = ReviewReducer(INITIAL_STATE, fetchMyReviewsSuccess([projectReview]));
    expect(state.projectReviews).toHaveLength(1);
    expect(state.projectReviews[0].projectTitle).toBe("Project One");
  });

  it("stores selected project review", () => {
    const state = ReviewReducer(INITIAL_STATE, fetchProjectReviewSuccess(projectReview));
    expect(state.selectedProjectReview?.projectId).toBe("project-1");
  });
});
