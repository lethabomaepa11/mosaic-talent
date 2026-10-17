"use client";

import { createContext } from "react";

export interface IReviewQuestion {
  id: string;
  text: string;
  type: string;
  relatedGoal?: string;
  category?: string;
  answerText?: string;
  gamificationReward?: IGamificationReward;
}

export interface IGamificationReward {
  pointsAwarded: number;
  totalPoints: number;
  level: number;
  badgesUnlocked: string[];
}

export interface IPeerReview {
  id: string;
  projectId: string;
  projectTitle: string;
  reviewerDeveloperId: string;
  reviewerName: string;
  revieweeDeveloperId: string;
  revieweeName: string;
  rating: number;
  isCompleted: boolean;
  questions: IReviewQuestion[];
  gamificationReward?: IGamificationReward;
}

export interface IAIReviewFeedback {
  summary: string;
  strengths: string[];
  improvementAreas: string[];
  tips: string[];
  growthScore: number;
}

export interface IProjectPeerReview {
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  canRequestPeerReview: boolean;
  peerReviewRequestMessage: string;
  assignedToMe: IPeerReview[];
  receivedByMe: IPeerReview[];
  feedback?: IAIReviewFeedback;
}

export interface IReviewStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  projectReviews: IProjectPeerReview[];
  selectedProjectReview?: IProjectPeerReview;
}

export interface IReviewActionContext {
  fetchMyProjectPeerReviews: () => Promise<void>;
  fetchProjectPeerReviews: (projectId: string) => Promise<IProjectPeerReview | undefined>;
  generateProjectPeerReviews: (projectId: string) => Promise<IProjectPeerReview | undefined>;
  requestProjectPeerReview: (projectId: string) => Promise<IProjectPeerReview | undefined>;
  setPeerReviewRating: (reviewId: string, rating: number) => Promise<IPeerReview | undefined>;
  submitReviewAnswer: (questionId: string, text: string) => Promise<IReviewQuestion | undefined>;
}

export const INITIAL_STATE: IReviewStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  projectReviews: [],
  selectedProjectReview: undefined,
};

export const ReviewStateContext = createContext<IReviewStateContext>(INITIAL_STATE);

export const ReviewActionContext = createContext<IReviewActionContext>({
  fetchMyProjectPeerReviews: async () => undefined,
  fetchProjectPeerReviews: async () => undefined,
  generateProjectPeerReviews: async () => undefined,
  requestProjectPeerReview: async () => undefined,
  setPeerReviewRating: async () => undefined,
  submitReviewAnswer: async () => undefined,
});
