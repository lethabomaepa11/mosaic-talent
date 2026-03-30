"use client";

import { createContext } from "react";

export interface IStudyLevelOption {
  value: number;
  label: string;
}

export interface IDeveloperProfile {
  githubUsername: string;
  avatarUrl?: string;
  yearsOfExperience?: number;
  yearOfStudy?: number;
  studyLevel: number;
  bio?: string;
  location?: string;
  teamworkRating: number;
  skills: string[];
  goals: string[];
}

export interface IGithubScanResult {
  score: number;
  insights: string[];
}

export interface ILearningPathRecommendation {
  goal: string;
  priority: "high" | "medium" | "low";
  estimatedWeeks: number;
  gapSummary: string;
  recommendedSkills: string[];
  suggestedActions: string[];
}

export interface ILearningPathResult {
  source: "ai" | "fallback";
  summary: string;
  marketSignals: string[];
  recommendations: ILearningPathRecommendation[];
}

export interface ICurrentUserSummary {
  id: number;
  userName: string;
  name: string;
  surname: string;
  emailAddress: string;
}

export interface IDeveloperStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  profile: IDeveloperProfile;
  studyLevels: IStudyLevelOption[];
  scanResult?: IGithubScanResult;
  learningPath?: ILearningPathResult;
  isLearningPathPending: boolean;
  currentUser?: ICurrentUserSummary;
}

export interface IDeveloperActionContext {
  fetchMyProfile: () => Promise<void>;
  fetchStudyLevels: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  upsertMyProfile: (input: IDeveloperProfile) => Promise<void>;
  scanMyGithubProfile: () => Promise<IGithubScanResult | undefined>;
  fetchLearningPathRecommendations: () => Promise<ILearningPathResult | undefined>;
}

export const INITIAL_PROFILE: IDeveloperProfile = {
  githubUsername: "",
  avatarUrl: "",
  yearsOfExperience: undefined,
  yearOfStudy: undefined,
  studyLevel: 0,
  bio: "",
  location: "",
  teamworkRating: 0,
  skills: [],
  goals: [],
};

export const INITIAL_STATE: IDeveloperStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  profile: INITIAL_PROFILE,
  studyLevels: [],
  scanResult: undefined,
  learningPath: undefined,
  isLearningPathPending: false,
  currentUser: undefined,
};

export const DeveloperStateContext =
  createContext<IDeveloperStateContext>(INITIAL_STATE);

export const DeveloperActionContext = createContext<IDeveloperActionContext>({
  fetchMyProfile: async () => undefined,
  fetchStudyLevels: async () => undefined,
  fetchCurrentUser: async () => undefined,
  upsertMyProfile: async () => undefined,
  scanMyGithubProfile: async () => undefined,
  fetchLearningPathRecommendations: async () => undefined,
});
