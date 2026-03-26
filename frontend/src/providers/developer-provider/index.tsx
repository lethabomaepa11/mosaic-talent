"use client";

import { PropsWithChildren, useContext, useReducer } from "react";
import { getAxiosInstance } from "@/utils/axiosInstance";
import { AxiosError } from "axios";
import {
  fetchLevelsError,
  fetchLevelsPending,
  fetchLevelsSuccess,
  fetchProfileError,
  fetchProfilePending,
  fetchProfileSuccess,
  fetchUserError,
  fetchUserPending,
  fetchUserSuccess,
  saveProfileError,
  saveProfilePending,
  saveProfileSuccess,
  scanGithubError,
  scanGithubPending,
  scanGithubSuccess,
} from "./actions";
import {
  DeveloperActionContext,
  DeveloperStateContext,
  IDeveloperProfile,
  IGithubScanResult,
  INITIAL_PROFILE,
  INITIAL_STATE,
} from "./context";
import { DeveloperReducer } from "./reducer";

const ENDPOINT = "/api/services/app/DeveloperOnboarding";

const normalizeProfile = (input: Partial<IDeveloperProfile>): IDeveloperProfile => ({
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

const normalizeUpsertInput = (input: IDeveloperProfile): IDeveloperProfile => ({
  githubUsername: (input.githubUsername ?? "").trim(),
  avatarUrl: (input.avatarUrl ?? "").trim(),
  yearsOfExperience: input.yearsOfExperience,
  yearOfStudy: input.yearOfStudy,
  studyLevel: input.studyLevel ?? 0,
  bio: (input.bio ?? "").trim(),
  location: (input.location ?? "").trim(),
  teamworkRating: input.teamworkRating ?? 0,
  skills: (input.skills ?? [])
    .map((item) => item.trim())
    .filter(Boolean),
  goals: (input.goals ?? [])
    .map((item) => item.trim())
    .filter(Boolean),
});

export const DeveloperProvider = ({ children }: PropsWithChildren) => {
  const instance = getAxiosInstance();
  const [state, dispatch] = useReducer(DeveloperReducer, INITIAL_STATE);

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

  const fetchCurrentUser = async () => {
    dispatch(fetchUserPending());

    try {
      const res = await instance.get(
        "/api/services/app/Session/GetCurrentLoginInformations",
      );
      const user = res.data?.result?.user;

      dispatch(
        fetchUserSuccess({
          id: Number(user?.id ?? 0),
          userName: user?.userName ?? "",
          name: user?.name ?? "",
          surname: user?.surname ?? "",
          emailAddress: user?.emailAddress ?? "",
        }),
      );
    } catch {
      dispatch(fetchUserError());
    }
  };

  const upsertMyProfile = async (input: IDeveloperProfile) => {
    dispatch(saveProfilePending());
    const payload = normalizeUpsertInput(input);

    if (!payload.githubUsername) {
      dispatch(saveProfileError());
      throw new Error("GitHub username is required.");
    }

    try {
      const res = await instance.post(`${ENDPOINT}/UpsertMyProfile`, payload);
      const profile = normalizeProfile(res.data?.result ?? INITIAL_PROFILE);
      dispatch(saveProfileSuccess(profile));
    } catch (error) {
      dispatch(saveProfileError());
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.error?.message as string | undefined)
          : undefined;
      throw new Error(message || "Failed to save developer profile.");
    }
  };

  const scanMyGithubProfile = async () => {
    dispatch(scanGithubPending());

    try {
      const res = await instance.get(`${ENDPOINT}/ScanMyGithubProfile`);
      const scanResult = (res.data?.result ?? {
        score: 0,
        insights: [],
      }) as IGithubScanResult;
      dispatch(scanGithubSuccess(scanResult));

      return scanResult;
    } catch {
      dispatch(scanGithubError());

      return undefined;
    }
  };

  return (
    <DeveloperStateContext.Provider value={state}>
      <DeveloperActionContext.Provider
        value={{
          fetchMyProfile,
          fetchStudyLevels,
          fetchCurrentUser,
          upsertMyProfile,
          scanMyGithubProfile,
        }}
      >
        {children}
      </DeveloperActionContext.Provider>
    </DeveloperStateContext.Provider>
  );
};

export const useDeveloperState = () => {
  return useContext(DeveloperStateContext);
};

export const useDeveloperAction = () => {
  return useContext(DeveloperActionContext);
};
