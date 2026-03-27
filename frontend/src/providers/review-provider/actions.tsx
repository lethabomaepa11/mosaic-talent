import { createAction } from "redux-actions";
import { IPeerReview, IProjectPeerReview, IReviewQuestion, IReviewStateContext } from "./context";

type ReviewStatePatch = Partial<IReviewStateContext>;

export enum ReviewStateEnums {
  REVIEW_FETCH_MY_PENDING = "REVIEW_FETCH_MY_PENDING",
  REVIEW_FETCH_MY_SUCCESS = "REVIEW_FETCH_MY_SUCCESS",
  REVIEW_FETCH_MY_ERROR = "REVIEW_FETCH_MY_ERROR",
  REVIEW_FETCH_ONE_PENDING = "REVIEW_FETCH_ONE_PENDING",
  REVIEW_FETCH_ONE_SUCCESS = "REVIEW_FETCH_ONE_SUCCESS",
  REVIEW_FETCH_ONE_ERROR = "REVIEW_FETCH_ONE_ERROR",
  REVIEW_GENERATE_PENDING = "REVIEW_GENERATE_PENDING",
  REVIEW_GENERATE_SUCCESS = "REVIEW_GENERATE_SUCCESS",
  REVIEW_GENERATE_ERROR = "REVIEW_GENERATE_ERROR",
  REVIEW_SET_RATING_PENDING = "REVIEW_SET_RATING_PENDING",
  REVIEW_SET_RATING_SUCCESS = "REVIEW_SET_RATING_SUCCESS",
  REVIEW_SET_RATING_ERROR = "REVIEW_SET_RATING_ERROR",
  REVIEW_ANSWER_PENDING = "REVIEW_ANSWER_PENDING",
  REVIEW_ANSWER_SUCCESS = "REVIEW_ANSWER_SUCCESS",
  REVIEW_ANSWER_ERROR = "REVIEW_ANSWER_ERROR",
}

export const fetchMyReviewsPending = createAction<ReviewStatePatch>(
  ReviewStateEnums.REVIEW_FETCH_MY_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const fetchMyReviewsSuccess = createAction<ReviewStatePatch, IProjectPeerReview[]>(
  ReviewStateEnums.REVIEW_FETCH_MY_SUCCESS,
  (projectReviews) => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    projectReviews,
  }),
);

export const fetchMyReviewsError = createAction<ReviewStatePatch>(
  ReviewStateEnums.REVIEW_FETCH_MY_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const fetchProjectReviewPending = createAction<ReviewStatePatch>(
  ReviewStateEnums.REVIEW_FETCH_ONE_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const fetchProjectReviewSuccess = createAction<ReviewStatePatch, IProjectPeerReview>(
  ReviewStateEnums.REVIEW_FETCH_ONE_SUCCESS,
  (selectedProjectReview) => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    selectedProjectReview,
  }),
);

export const fetchProjectReviewError = createAction<ReviewStatePatch>(
  ReviewStateEnums.REVIEW_FETCH_ONE_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const generateProjectReviewPending = createAction<ReviewStatePatch>(
  ReviewStateEnums.REVIEW_GENERATE_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const generateProjectReviewSuccess = createAction<ReviewStatePatch, IProjectPeerReview>(
  ReviewStateEnums.REVIEW_GENERATE_SUCCESS,
  (selectedProjectReview) => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    selectedProjectReview,
  }),
);

export const generateProjectReviewError = createAction<ReviewStatePatch>(
  ReviewStateEnums.REVIEW_GENERATE_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const setRatingPending = createAction<ReviewStatePatch>(
  ReviewStateEnums.REVIEW_SET_RATING_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const setRatingSuccess = createAction<ReviewStatePatch, IPeerReview>(
  ReviewStateEnums.REVIEW_SET_RATING_SUCCESS,
  () => ({
    isPending: false,
    isSuccess: true,
    isError: false,
  }),
);

export const setRatingError = createAction<ReviewStatePatch>(
  ReviewStateEnums.REVIEW_SET_RATING_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const answerQuestionPending = createAction<ReviewStatePatch>(
  ReviewStateEnums.REVIEW_ANSWER_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const answerQuestionSuccess = createAction<ReviewStatePatch, IReviewQuestion>(
  ReviewStateEnums.REVIEW_ANSWER_SUCCESS,
  () => ({
    isPending: false,
    isSuccess: true,
    isError: false,
  }),
);

export const answerQuestionError = createAction<ReviewStatePatch>(
  ReviewStateEnums.REVIEW_ANSWER_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);
