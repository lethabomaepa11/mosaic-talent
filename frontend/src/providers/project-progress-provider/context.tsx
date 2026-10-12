"use client";

import { createContext } from "react";

export interface IProjectProgressReview {
  id: string;
  reviewerDeveloperId: string;
  reviewerName: string;
  reviewerRole: "teammate" | "mentor";
  comment: string;
  createdAt: string;
}

export interface IProjectProgressEntry {
  id: string;
  projectId: string;
  developerId: string;
  authorName: string;
  title: string;
  summary: string;
  evidenceUrl: string;
  selfReview: string;
  createdAt: string;
  reviews: IProjectProgressReview[];
}

export interface ICreateProjectProgressEntryInput {
  projectId: string;
  title: string;
  summary: string;
  evidenceUrl: string;
  selfReview: string;
}

export interface IProjectProgressStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  entries: IProjectProgressEntry[];
}

export interface IProjectProgressActionContext {
  fetchProjectEntries: (projectId: string) => Promise<IProjectProgressEntry[]>;
  createEntry: (input: ICreateProjectProgressEntryInput) => Promise<IProjectProgressEntry>;
  reviewEntry: (entryId: string, comment: string) => Promise<IProjectProgressEntry>;
}

export const INITIAL_STATE: IProjectProgressStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  entries: [],
};

export const ProjectProgressStateContext = createContext<IProjectProgressStateContext>(INITIAL_STATE);
export const ProjectProgressActionContext = createContext<IProjectProgressActionContext>({
  fetchProjectEntries: async () => [],
  createEntry: async () => { throw new Error("Progress provider is not mounted."); },
  reviewEntry: async () => { throw new Error("Progress provider is not mounted."); },
});
