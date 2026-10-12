import { describe, expect, it } from "vitest";
import {
  ReviewStateEnums,
  fetchMyReviewsSuccess,
  fetchProjectReviewSuccess,
} from "../actions";

const projectReview = {
  projectId: "project-1",
  projectTitle: "Project One",
  projectStatus: "in-progress",
  canRequestPeerReview: true,
  peerReviewRequestMessage: "",
  assignedToMe: [],
  receivedByMe: [],
};

describe("review actions", () => {
  it("creates fetch success payloads", () => {
    expect(fetchMyReviewsSuccess([projectReview])).toMatchObject({
      type: ReviewStateEnums.REVIEW_FETCH_MY_SUCCESS,
      payload: {
        projectReviews: [projectReview],
      },
    });

    expect(fetchProjectReviewSuccess(projectReview)).toMatchObject({
      type: ReviewStateEnums.REVIEW_FETCH_ONE_SUCCESS,
      payload: {
        selectedProjectReview: projectReview,
      },
    });
  });
});
