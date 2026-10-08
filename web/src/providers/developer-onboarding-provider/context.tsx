"use client";

import { createContext } from "react";

export interface IStudyLevelOption {
  value: number;
  label: string;
}

export interface IDeveloperOnboardingProfile {
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

export interface IDeveloperOnboardingStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  profile: IDeveloperOnboardingProfile;
  studyLevels: IStudyLevelOption[];
}

export interface IDeveloperOnboardingActionContext {
  fetchMyProfile: () => Promise<void>;
  fetchStudyLevels: () => Promise<void>;
  upsertMyProfile: (input: IDeveloperOnboardingProfile) => Promise<void>;
}

export const INITIAL_PROFILE: IDeveloperOnboardingProfile = {
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

export const INITIAL_STATE: IDeveloperOnboardingStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  profile: INITIAL_PROFILE,
  studyLevels: [],
};

export const DeveloperOnboardingStateContext =
  createContext<IDeveloperOnboardingStateContext>(INITIAL_STATE);

export const DeveloperOnboardingActionContext =
  createContext<IDeveloperOnboardingActionContext>({
    fetchMyProfile: async () => undefined,
    fetchStudyLevels: async () => undefined,
    upsertMyProfile: async () => undefined,
  });
