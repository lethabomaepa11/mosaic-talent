"use client";

import { PropsWithChildren, useContext, useReducer } from "react";
import { AxiosError } from "axios";
import { getAxiosInstance } from "@/utils/axiosInstance";
import {
  answerQuestionError,
  answerQuestionPending,
  answerQuestionSuccess,
  fetchMyReviewsError,
  fetchMyReviewsPending,
  fetchMyReviewsSuccess,
  fetchProjectReviewError,
  fetchProjectReviewPending,
  fetchProjectReviewSuccess,
  generateProjectReviewError,
  generateProjectReviewPending,
  generateProjectReviewSuccess,
  setRatingError,
  setRatingPending,
  setRatingSuccess,
} from "./actions";
import {
  IAIReviewFeedback,
  IPeerReview,
  IProjectPeerReview,
  IReviewQuestion,
  INITIAL_STATE,
  ReviewActionContext,
  ReviewStateContext,
} from "./context";
import { ReviewReducer } from "./reducer";

const ENDPOINT = "/api/services/app/PeerReview";

const readApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.error?.message as string | undefined;
    return message || fallback;
  }

  return fallback;
};

const normalizeQuestion = (input: Partial<IReviewQuestion>): IReviewQuestion => ({
  id: String(input.id ?? ""),
  text: input.text ?? "",
  type: input.type ?? "open",
  relatedGoal: input.relatedGoal ?? "",
  category: input.category ?? "",
  answerText: input.answerText ?? "",
  gamificationReward: input.gamificationReward
    ? {
        pointsAwarded: Number(input.gamificationReward.pointsAwarded ?? 0),
        totalPoints: Number(input.gamificationReward.totalPoints ?? 0),
        level: Number(input.gamificationReward.level ?? 1),
        badgesUnlocked: input.gamificationReward.badgesUnlocked ?? [],
      }
    : undefined,
});

const normalizeReview = (input: Partial<IPeerReview>): IPeerReview => ({
  id: String(input.id ?? ""),
  projectId: String(input.projectId ?? ""),
  projectTitle: input.projectTitle ?? "",
  reviewerDeveloperId: String(input.reviewerDeveloperId ?? ""),
  reviewerName: input.reviewerName ?? "Reviewer",
  revieweeDeveloperId: String(input.revieweeDeveloperId ?? ""),
  revieweeName: input.revieweeName ?? "Teammate",
  rating: Number(input.rating ?? 5),
  isCompleted: Boolean(input.isCompleted),
  questions: (input.questions ?? []).map(normalizeQuestion),
  gamificationReward: input.gamificationReward
    ? {
        pointsAwarded: Number(input.gamificationReward.pointsAwarded ?? 0),
        totalPoints: Number(input.gamificationReward.totalPoints ?? 0),
        level: Number(input.gamificationReward.level ?? 1),
        badgesUnlocked: input.gamificationReward.badgesUnlocked ?? [],
      }
    : undefined,
});

const normalizeFeedback = (input?: Partial<IAIReviewFeedback>): IAIReviewFeedback | undefined => {
  if (!input) {
    return undefined;
  }

  return {
    summary: input.summary ?? "",
    strengths: input.strengths ?? [],
    improvementAreas: input.improvementAreas ?? [],
    tips: input.tips ?? [],
    growthScore: Number(input.growthScore ?? 0),
  };
};

const normalizeProjectReview = (input: Partial<IProjectPeerReview>): IProjectPeerReview => ({
  projectId: String(input.projectId ?? ""),
  projectTitle: input.projectTitle ?? "",
  projectStatus: input.projectStatus ?? "completed",
  canRequestPeerReview: Boolean(input.canRequestPeerReview),
  peerReviewRequestMessage: input.peerReviewRequestMessage ?? "",
  assignedToMe: (input.assignedToMe ?? []).map(normalizeReview),
  receivedByMe: (input.receivedByMe ?? []).map(normalizeReview),
  feedback: normalizeFeedback(input.feedback),
});

const normalizeProjectReviewList = (input: unknown): IProjectPeerReview[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item) => normalizeProjectReview(item as Partial<IProjectPeerReview>));
};

export const ReviewProvider = ({ children }: PropsWithChildren) => {
  const instance = getAxiosInstance();
  const [state, dispatch] = useReducer(ReviewReducer, INITIAL_STATE);

  const fetchMyProjectPeerReviews = async () => {
    dispatch(fetchMyReviewsPending());

    try {
      const res = await instance.get(`${ENDPOINT}/GetMyProjectPeerReviews`);
      const projectReviews = normalizeProjectReviewList(res.data?.result);
      dispatch(fetchMyReviewsSuccess(projectReviews));
    } catch {
      dispatch(fetchMyReviewsError());
    }
  };

  const fetchProjectPeerReviews = async (projectId: string) => {
    dispatch(fetchProjectReviewPending());

    try {
      const res = await instance.get(`${ENDPOINT}/GetProjectPeerReviews`, {
        params: {
          projectId,
          ProjectId: projectId,
          "input.projectId": projectId,
        },
      });
      const projectReview = normalizeProjectReview((res.data?.result ?? {}) as Partial<IProjectPeerReview>);
      dispatch(fetchProjectReviewSuccess(projectReview));
      return projectReview;
    } catch (error) {
      dispatch(fetchProjectReviewError());
      throw new Error(readApiErrorMessage(error, "Failed to load project reviews."));
    }
  };

  const generateProjectPeerReviews = async (projectId: string) => {
    dispatch(generateProjectReviewPending());

    try {
      const res = await instance.post(`${ENDPOINT}/GenerateProjectPeerReviews`, { projectId });
      const projectReview = normalizeProjectReview((res.data?.result ?? {}) as Partial<IProjectPeerReview>);
      dispatch(generateProjectReviewSuccess(projectReview));
      await fetchMyProjectPeerReviews();
      return projectReview;
    } catch (error) {
      dispatch(generateProjectReviewError());
      throw new Error(readApiErrorMessage(error, "Failed to generate project peer reviews."));
    }
  };

  const requestProjectPeerReview = async (projectId: string) => {
    dispatch(generateProjectReviewPending());

    try {
      const res = await instance.post(`${ENDPOINT}/RequestProjectPeerReview`, { projectId });
      const projectReview = normalizeProjectReview((res.data?.result ?? {}) as Partial<IProjectPeerReview>);
      dispatch(generateProjectReviewSuccess(projectReview));
      await fetchMyProjectPeerReviews();
      return projectReview;
    } catch (error) {
      dispatch(generateProjectReviewError());
      throw new Error(readApiErrorMessage(error, "Failed to request a peer review."));
    }
  };

  const setPeerReviewRating = async (reviewId: string, rating: number) => {
    dispatch(setRatingPending());

    try {
      const res = await instance.post(`${ENDPOINT}/SetPeerReviewRating`, { reviewId, rating });
      const review = normalizeReview((res.data?.result ?? {}) as Partial<IPeerReview>);
      dispatch(setRatingSuccess(review));

      if (review.projectId) {
        await fetchProjectPeerReviews(review.projectId);
      }
      await fetchMyProjectPeerReviews();
      return review;
    } catch (error) {
      dispatch(setRatingError());
      throw new Error(readApiErrorMessage(error, "Failed to update review rating."));
    }
  };

  const submitReviewAnswer = async (questionId: string, text: string) => {
    dispatch(answerQuestionPending());

    try {
      const res = await instance.post(`${ENDPOINT}/SubmitReviewAnswer`, { questionId, text });
      const question = normalizeQuestion((res.data?.result ?? {}) as Partial<IReviewQuestion>);
      dispatch(answerQuestionSuccess(question));

      const selectedProjectId = state.selectedProjectReview?.projectId;
      if (selectedProjectId) {
        await fetchProjectPeerReviews(selectedProjectId);
      }
      await fetchMyProjectPeerReviews();
      return question;
    } catch (error) {
      dispatch(answerQuestionError());
      throw new Error(readApiErrorMessage(error, "Failed to submit review answer."));
    }
  };

  return (
    <ReviewStateContext.Provider value={state}>
      <ReviewActionContext.Provider
        value={{
          fetchMyProjectPeerReviews,
          fetchProjectPeerReviews,
          generateProjectPeerReviews,
          requestProjectPeerReview,
          setPeerReviewRating,
          submitReviewAnswer,
        }}
      >
        {children}
      </ReviewActionContext.Provider>
    </ReviewStateContext.Provider>
  );
};

export const useReviewState = () => {
  return useContext(ReviewStateContext);
};

export const useReviewAction = () => {
  return useContext(ReviewActionContext);
};

export type {
  IAIReviewFeedback,
  IPeerReview,
  IProjectPeerReview,
  IReviewQuestion,
} from "./context";
