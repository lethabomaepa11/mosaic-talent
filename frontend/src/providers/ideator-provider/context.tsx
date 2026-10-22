"use client";
import { createContext } from "react";

export type IdeaReaction = "Interested" | "Like" | "Dislike";
export interface IIdeaComment { id: string; authorDeveloperId: string; authorName: string; body: string; createdAt: string; }
export interface IIdeaPost {
  id: string; creatorDeveloperId: string; creatorName: string; title: string; problemStatement: string; proposedSolution: string;
  createdAt: string; myReaction?: IdeaReaction; interestedCount: number; likeCount: number; dislikeCount: number; commentCount: number;
  isOwner: boolean; isPublic: boolean; isConverted: boolean; convertedProjectId?: string; comments: IIdeaComment[];
}
export interface IIdeatorState { isPending: boolean; isError: boolean; ideas: IIdeaPost[]; }
export interface IIdeatorActions {
  fetchFeed(): Promise<void>;
  createIdea(input: { title: string; problemStatement: string; proposedSolution: string; isPublic: boolean }): Promise<void>;
  react(ideaPostId: string, type: IdeaReaction): Promise<void>;
  comment(ideaPostId: string, body: string): Promise<void>;
  convert(ideaPostId: string, inviteInterestedDevelopers: boolean): Promise<IIdeaPost | undefined>;
  deleteIdea(ideaPostId: string): Promise<void>;
}
export const INITIAL_IDEATOR_STATE: IIdeatorState = { isPending: false, isError: false, ideas: [] };
export const IdeatorStateContext = createContext(INITIAL_IDEATOR_STATE);
export const IdeatorActionContext = createContext<IIdeatorActions>({
  fetchFeed: async () => undefined, createIdea: async () => undefined, react: async () => undefined,
  comment: async () => undefined, convert: async () => undefined, deleteIdea: async () => undefined,
});
