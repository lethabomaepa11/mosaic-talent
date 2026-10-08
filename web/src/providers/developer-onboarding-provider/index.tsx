"use client";

import { PropsWithChildren, useContext, useReducer } from "react";
import { getAxiosInstance } from "@/utils/axiosInstance";
import {
  fetchLevelsError,
  fetchLevelsPending,
  fetchLevelsSuccess,
  fetchProfileError,
  fetchProfilePending,
  fetchProfileSuccess,
  saveError,
  savePending,
  saveSuccess,
} from "./actions";
import {
  DeveloperOnboardingActionContext,
  DeveloperOnboardingStateContext,
  IDeveloperOnboardingProfile,
  INITIAL_PROFILE,
  INITIAL_STATE,
} from "./context";
import { DeveloperOnboardingReducer } from "./reducer";

const ENDPOINT = "/api/services/app/DeveloperOnboarding";

const normalizeProfile = (input: Partial<IDeveloperOnboardingProfile>) => ({
  githubUsername: input.githubUsername ?? "",
  avatarUrl: input.avatarUrl ?? "",
  yearsOfExperience: input.yearsOfExperience,
  yearOfStudy: input.yearOfStudy,
  studyLevel: input.studyLevel ?? 0,
  bio: input.bio ?? "",
  location: input.location ?? "",
  teamworkRating: input.teamworkRating ?? 0,
  skills: input.skills ?? [],
  goals: input.goals ?? [],
});

export const DeveloperOnboardingProvider = ({ children }: PropsWithChildren) => {
  const instance = getAxiosInstance();
  const [state, dispatch] = useReducer(DeveloperOnboardingReducer, INITIAL_STATE);

  const fetchMyProfile = async () => {
    dispatch(fetchProfilePending());

    try {
      const res = await instance.get(`${ENDPOINT}/GetMyProfile`);
      const profile = normalizeProfile(res.data?.result ?? INITIAL_PROFILE);
      dispatch(fetchProfileSuccess(profile));
    } catch {
      dispatch(fetchProfileError());
    }
  };

  const fetchStudyLevels = async () => {
    dispatch(fetchLevelsPending());

    try {
      const res = await instance.get(`${ENDPOINT}/GetStudyLevels`);
      dispatch(fetchLevelsSuccess(res.data?.result ?? []));
    } catch {
      dispatch(fetchLevelsError());
    }
  };

  const upsertMyProfile = async (input: IDeveloperOnboardingProfile) => {
    dispatch(savePending());

    try {
      const res = await instance.post(`${ENDPOINT}/UpsertMyProfile`, input);
      const profile = normalizeProfile(res.data?.result ?? INITIAL_PROFILE);
      dispatch(saveSuccess(profile));
    } catch {
      dispatch(saveError());
    }
  };

  return (
    <DeveloperOnboardingStateContext.Provider value={state}>
      <DeveloperOnboardingActionContext.Provider
        value={{ fetchMyProfile, fetchStudyLevels, upsertMyProfile }}
      >
        {children}
      </DeveloperOnboardingActionContext.Provider>
    </DeveloperOnboardingStateContext.Provider>
  );
};

export const useDeveloperOnboardingState = () => {
  return useContext(DeveloperOnboardingStateContext);
};

export const useDeveloperOnboardingAction = () => {
  return useContext(DeveloperOnboardingActionContext);
};
