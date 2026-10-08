import { IProjectPeerReview } from "@/providers/review-provider";

export interface IReviewProjectSummary {
  projectId: string;
  projectTitle: string;
  pendingCount: number;
  completedCount: number;
  receivedCount: number;
}

export const toReviewProjectSummary = (
  projectReview: IProjectPeerReview,
): IReviewProjectSummary => {
  const pendingCount = projectReview.assignedToMe.filter((item) => !item.isCompleted).length;
  const completedCount = projectReview.assignedToMe.length - pendingCount;

  return {
    projectId: projectReview.projectId,
    projectTitle: projectReview.projectTitle,
    pendingCount,
    completedCount,
    receivedCount: projectReview.receivedByMe.length,
  };
};
