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
  IDeveloperSearchResult,
  IGamificationSummary,
  IGithubScanResult,
  ILearningPathResult,
  IProfileFieldSuggestionsInput,
  IProfileFieldSuggestionsResult,
  IPublicDeveloperProfile,
  INITIAL_PROFILE,
  INITIAL_STATE,
} from "./context";
import { DeveloperReducer } from "./reducer";

const ENDPOINT = "/api/services/app/DeveloperOnboarding";

const readApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.error?.message as string | undefined;
    return message || fallback;
  }

  return fallback;
};

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

const normalizeLearningPath = (input: Partial<ILearningPathResult>): ILearningPathResult => ({
  source: input.source === "ai" ? "ai" : "fallback",
  summary: input.summary ?? "",
  marketSignals: input.marketSignals ?? [],
  recommendations: (input.recommendations ?? []).map((item) => ({
    goal: item.goal ?? "",
    priority:
      item.priority === "high" || item.priority === "low"
        ? item.priority
        : "medium",
    estimatedWeeks: Number(item.estimatedWeeks ?? 6),
    gapSummary: item.gapSummary ?? "",
    recommendedSkills: item.recommendedSkills ?? [],
    suggestedActions: item.suggestedActions ?? [],
  })),
});

const normalizeGamificationSummary = (
  input: Partial<IGamificationSummary>,
): IGamificationSummary => ({
  totalPoints: Number(input.totalPoints ?? 0),
  level: Number(input.level ?? 1),
  nextLevelPoints: Number(input.nextLevelPoints ?? 100),
  progressPercent: Number(input.progressPercent ?? 0),
  badges: (input.badges ?? []).map((badge) => ({
    code: badge.code ?? "",
    name: badge.name ?? "",
    description: badge.description ?? "",
    earnedAt: badge.earnedAt ?? "",
  })),
  recentEvents: (input.recentEvents ?? []).map((item) => ({
    eventType: item.eventType ?? "",
    pointsAwarded: Number(item.pointsAwarded ?? 0),
    occurredAt: item.occurredAt ?? "",
  })),
});

const normalizeProfileFieldSuggestions = (
  input: Partial<IProfileFieldSuggestionsResult>,
): IProfileFieldSuggestionsResult => ({
  field: input.field === "goal" ? "goal" : "skill",
  query: input.query ?? "",
  source: input.source === "ai" ? "ai" : "fallback",
  suggestions: Array.isArray(input.suggestions)
    ? input.suggestions
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    : [],
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

const normalizeDeveloperSearchResult = (
  input: Partial<IDeveloperSearchResult>,
): IDeveloperSearchResult => ({
  userName: input.userName ?? "",
  displayName: input.displayName ?? "",
  avatarUrl: input.avatarUrl ?? "",
  githubUsername: input.githubUsername ?? "",
  skillTags: input.skillTags ?? [],
  yearsOfExperience: input.yearsOfExperience,
});

const normalizeDeveloperSearchResults = (input: unknown): IDeveloperSearchResult[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item) =>
    normalizeDeveloperSearchResult(item as Partial<IDeveloperSearchResult>),
  );
};

const normalizePublicProject = (
  input: NonNullable<IPublicDeveloperProfile["currentProjects"]>[number],
) => ({
  id: String(input.id ?? ""),
  title: input.title ?? "",
  description: input.description ?? "",
  status: input.status ?? "open",
  githubRepo: input.githubRepo ?? "",
  createdAt: input.createdAt ?? new Date().toISOString(),
  skills: input.skills ?? [],
});

const normalizePublicProfile = (
  input: Partial<IPublicDeveloperProfile>,
): IPublicDeveloperProfile => ({
  userName: input.userName ?? "",
  displayName: input.displayName ?? "",
  avatarUrl: input.avatarUrl ?? "",
  githubUsername: input.githubUsername ?? "",
  yearsOfExperience: input.yearsOfExperience,
  yearOfStudy: input.yearOfStudy,
  studyLevel: Number(input.studyLevel ?? 0),
  bio: input.bio ?? "",
  location: input.location ?? "",
  teamworkRating: Number(input.teamworkRating ?? 0),
  skills: input.skills ?? [],
  currentProjects: (input.currentProjects ?? []).map(normalizePublicProject),
  completedProjects: (input.completedProjects ?? []).map(normalizePublicProject),
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
