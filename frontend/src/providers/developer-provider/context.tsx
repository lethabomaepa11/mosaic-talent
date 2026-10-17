"use client";

import { createContext } from "react";

export interface IStudyLevelOption {
  value: number;
  label: string;
}

export interface IDeveloperProfile {
  userId?: number;
  fullName?: string;
  emailAddress?: string;
  hasCompletedOnboarding?: boolean;
  completeOnboarding?: boolean;
  onboardingStep?: number;
  githubUsername: string;
  avatarUrl?: string;
  yearsOfExperience?: number;
  yearOfStudy?: number;
  studyLevel: number;
  bio?: string;
  location?: string;
  teamworkRating?: number;
  skills: string[];
  goals: string[];
}

export interface IPublicDeveloperProject {
  id: string;
  title: string;
  description: string;
  status: string;
  githubRepo?: string;
  createdAt: string;
  skills: string[];
}

export interface IPublicDeveloperProfile {
  userName: string;
  displayName: string;
  avatarUrl?: string;
  githubUsername?: string;
  yearsOfExperience?: number;
  yearOfStudy?: number;
  studyLevel: number;
  bio?: string;
  location?: string;
  teamworkRating: number;
  skills: string[];
  currentProjects: IPublicDeveloperProject[];
  completedProjects: IPublicDeveloperProject[];
}

export interface IDeveloperSearchResult {
  userName: string;
  displayName: string;
  avatarUrl?: string;
  githubUsername?: string;
  skillTags: string[];
  yearsOfExperience?: number;
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

export interface IProfileFieldSuggestionsInput {
  field: "skill" | "goal";
  query?: string;
  existingValues?: string[];
  maxResults?: number;
}

export interface IProfileFieldSuggestionsResult {
  field: "skill" | "goal";
  query: string;
  source: "ai" | "fallback";
  suggestions: string[];
}

export interface IGamificationBadge {
  code: string;
  name: string;
  description: string;
  earnedAt: string;
}

export interface IGamificationEvent {
  eventType: string;
  pointsAwarded: number;
  occurredAt: string;
}

export interface IGamificationSummary {
  totalPoints: number;
  level: number;
  nextLevelPoints: number;
  progressPercent: number;
  badges: IGamificationBadge[];
  recentEvents: IGamificationEvent[];
}

export interface ICurrentUserSummary {
  id: number;
  userName: string;
  name: string;
  surname: string;
  emailAddress: string;
}

export interface IDeveloperStateContext {
  profileStatus: "idle" | "loading" | "ready" | "error";
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  profile: IDeveloperProfile;
  studyLevels: IStudyLevelOption[];
  scanResult?: IGithubScanResult;
  learningPath?: ILearningPathResult;
  isLearningPathPending: boolean;
  gamificationSummary?: IGamificationSummary;
  isGamificationPending: boolean;
  currentUser?: ICurrentUserSummary;
}

export interface IDeveloperActionContext {
  fetchMyProfile: () => Promise<IDeveloperProfile | undefined>;
  getGithubSkillSuggestions: () => Promise<string[]>;
  fetchStudyLevels: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  upsertMyProfile: (input: IDeveloperProfile) => Promise<IDeveloperProfile>;
  getPublicProfile: (userName: string) => Promise<IPublicDeveloperProfile | undefined>;
  searchPublicDevelopers: (query: string) => Promise<IDeveloperSearchResult[]>;
  scanMyGithubProfile: () => Promise<IGithubScanResult | undefined>;
  fetchLearningPathRecommendations: () => Promise<ILearningPathResult | undefined>;
  getProfileFieldSuggestions: (
    input: IProfileFieldSuggestionsInput,
  ) => Promise<IProfileFieldSuggestionsResult>;
  fetchMyGamificationSummary: () => Promise<IGamificationSummary | undefined>;
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
  profileStatus: "idle",
  isPending: false,
  isSuccess: false,
  isError: false,
  profile: INITIAL_PROFILE,
  studyLevels: [],
  scanResult: undefined,
  learningPath: undefined,
  isLearningPathPending: false,
  gamificationSummary: undefined,
  isGamificationPending: false,
  currentUser: undefined,
};

export const DeveloperStateContext =
  createContext<IDeveloperStateContext>(INITIAL_STATE);

export const DeveloperActionContext = createContext<IDeveloperActionContext>({
  fetchMyProfile: async () => undefined,
  getGithubSkillSuggestions: async () => [],
  fetchStudyLevels: async () => undefined,
  fetchCurrentUser: async () => undefined,
  upsertMyProfile: async (input) => input,
  getPublicProfile: async () => undefined,
  searchPublicDevelopers: async () => [],
  scanMyGithubProfile: async () => undefined,
  fetchLearningPathRecommendations: async () => undefined,
  getProfileFieldSuggestions: async (input) => ({
    field: input.field,
    query: input.query ?? "",
    source: "fallback",
    suggestions: [],
  }),
  fetchMyGamificationSummary: async () => undefined,
});
