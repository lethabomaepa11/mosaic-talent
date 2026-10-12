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
  fetchGamificationError,
  fetchGamificationPending,
  fetchGamificationSuccess,
  fetchLearningPathError,
  fetchLearningPathPending,
  fetchLearningPathSuccess,
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
  IProfileFieldSuggestionsInput,
  IProfileFieldSuggestionsResult,
  IPublicDeveloperProfile,
  INITIAL_PROFILE,
  INITIAL_STATE,
} from "./context";
import { DeveloperReducer } from "./reducer";

const ENDPOINT = "/api/services/app/DeveloperOnboarding";

import {
  normalizeProfile, normalizeLearningPath, normalizeGamificationSummary,
  normalizeProfileFieldSuggestions, normalizeUpsertInput,
  normalizeDeveloperSearchResults, normalizePublicProfile, readApiErrorMessage,
} from "./normalizers";

export const DeveloperProvider = ({ children }: PropsWithChildren) => {
  const instance = getAxiosInstance();
  const [state, dispatch] = useReducer(DeveloperReducer, INITIAL_STATE);

  const fetchMyProfile = async () => {
    dispatch(fetchProfilePending());

    try {
      const res = await instance.get(`${ENDPOINT}/GetMyProfile`);
      const profile = normalizeProfile(res.data?.result ?? INITIAL_PROFILE);
      dispatch(fetchProfileSuccess(profile));
      return profile;
    } catch {
      dispatch(fetchProfileError());
    }
  };

  const getGithubSkillSuggestions = async (): Promise<string[]> => {
    try {
      const res = await instance.get(`${ENDPOINT}/GetGithubSkillSuggestions`);
      return Array.isArray(res.data?.result) ? res.data.result.filter((value: unknown) => typeof value === "string") : [];
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "GitHub skills are unavailable. Add your skills manually."));
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

    try {
      const res = await instance.post(`${ENDPOINT}/UpsertMyProfile`, payload);
      const profile = normalizeProfile(res.data?.result ?? INITIAL_PROFILE);
      dispatch(saveProfileSuccess(profile));
      return profile;
    } catch (error) {
      dispatch(saveProfileError());
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.error?.message as string | undefined)
          : undefined;
      throw new Error(message || "Failed to save developer profile.");
    }
  };

  const searchPublicDevelopers = async (query: string) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return [];
    }

    const params = {
      query: normalizedQuery,
      Query: normalizedQuery,
      "input.query": normalizedQuery,
    };

    try {
      const res = await instance.get(`${ENDPOINT}/SearchPublicDevelopers`, {
        params,
      });

      return normalizeDeveloperSearchResults(res.data?.result);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.error?.message as string | undefined)
          : undefined;
      throw new Error(message || "Failed to search developers.");
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

  const fetchLearningPathRecommendations = async () => {
    dispatch(fetchLearningPathPending());

    try {
      const res = await instance.get(`${ENDPOINT}/GetMyLearningPathRecommendations`);
      const learningPath = normalizeLearningPath(res.data?.result ?? {});
      dispatch(fetchLearningPathSuccess(learningPath));
      return learningPath;
    } catch {
      dispatch(fetchLearningPathError());
      return undefined;
    }
  };

  const getProfileFieldSuggestions = async (input: IProfileFieldSuggestionsInput) => {
    try {
      const res = await instance.post(`${ENDPOINT}/GetProfileFieldSuggestions`, {
        field: input.field,
        query: (input.query ?? "").trim(),
        existingValues: input.existingValues ?? [],
        maxResults: input.maxResults ?? 8,
      });

      return normalizeProfileFieldSuggestions(
        (res.data?.result ?? {}) as Partial<IProfileFieldSuggestionsResult>,
      );
    } catch (error) {
      throw new Error(
        readApiErrorMessage(error, "Failed to load profile suggestions."),
      );
    }
  };

  const getPublicProfile = async (userName: string) => {
    const normalizedUserName = userName.trim();
    if (!normalizedUserName) {
      throw new Error("Username is required.");
    }

    try {
      const res = await instance.get(`${ENDPOINT}/GetPublicProfile`, {
        params: {
          userName: normalizedUserName,
          UserName: normalizedUserName,
          "input.userName": normalizedUserName,
        },
      });

      if (!res.data?.result) {
        return undefined;
      }

      return normalizePublicProfile(
        res.data.result as Partial<IPublicDeveloperProfile>,
      );
    } catch (error) {
      throw new Error(readApiErrorMessage(error, "Failed to load public profile."));
    }
  };

  const fetchMyGamificationSummary = async () => {
    dispatch(fetchGamificationPending());

    try {
      const res = await instance.get(`${ENDPOINT}/GetMyGamificationSummary`);
      const summary = normalizeGamificationSummary(res.data?.result ?? {});
      dispatch(fetchGamificationSuccess(summary));
      return summary;
    } catch {
      dispatch(fetchGamificationError());
      return undefined;
    }
  };

  return (
    <DeveloperStateContext.Provider value={state}>
      <DeveloperActionContext.Provider
        value={{
          fetchMyProfile,
          getGithubSkillSuggestions,
          fetchStudyLevels,
          fetchCurrentUser,
          upsertMyProfile,
          getPublicProfile,
          searchPublicDevelopers,
          scanMyGithubProfile,
          fetchLearningPathRecommendations,
          getProfileFieldSuggestions,
          fetchMyGamificationSummary,
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

export type {
  IDeveloperProfile,
  IDeveloperSearchResult,
  IPublicDeveloperProfile,
} from "./context";
