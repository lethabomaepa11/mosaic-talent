import { handleActions } from "redux-actions";
import { INITIAL_STATE, IReviewStateContext } from "./context";
import { ReviewStateEnums } from "./actions";

type ReviewStatePatch = Partial<IReviewStateContext>;

export const ReviewReducer = handleActions<IReviewStateContext, ReviewStatePatch>(
  {
    [ReviewStateEnums.REVIEW_FETCH_MY_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ReviewStateEnums.REVIEW_FETCH_MY_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ReviewStateEnums.REVIEW_FETCH_MY_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ReviewStateEnums.REVIEW_FETCH_ONE_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ReviewStateEnums.REVIEW_FETCH_ONE_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
      projectReviews: state.projectReviews.map((item) =>
        item.projectId === payload?.selectedProjectReview?.projectId
          ? payload.selectedProjectReview
          : item,
      ),
    }),
    [ReviewStateEnums.REVIEW_FETCH_ONE_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ReviewStateEnums.REVIEW_GENERATE_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ReviewStateEnums.REVIEW_GENERATE_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
      projectReviews: state.projectReviews.some(
        (item) => item.projectId === payload?.selectedProjectReview?.projectId,
      )
        ? state.projectReviews.map((item) =>
            item.projectId === payload?.selectedProjectReview?.projectId
              ? payload.selectedProjectReview
              : item,
          )
        : payload?.selectedProjectReview
          ? [payload.selectedProjectReview, ...state.projectReviews]
          : state.projectReviews,
    }),
    [ReviewStateEnums.REVIEW_GENERATE_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ReviewStateEnums.REVIEW_SET_RATING_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ReviewStateEnums.REVIEW_SET_RATING_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ReviewStateEnums.REVIEW_SET_RATING_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ReviewStateEnums.REVIEW_ANSWER_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ReviewStateEnums.REVIEW_ANSWER_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [ReviewStateEnums.REVIEW_ANSWER_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
  },
  INITIAL_STATE,
);
