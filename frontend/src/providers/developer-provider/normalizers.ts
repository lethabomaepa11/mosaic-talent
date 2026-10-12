import { AxiosError } from "axios";
import {
  IDeveloperProfile,
  IDeveloperSearchResult,
  IGamificationSummary,
  ILearningPathResult,
  IProfileFieldSuggestionsResult,
  IPublicDeveloperProfile,
} from "./context";
export const readApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.error?.message as string | undefined;
    return message || fallback;
  }

  return fallback;
};

export const normalizeProfile = (input: Partial<IDeveloperProfile>): IDeveloperProfile => ({
  userId: input.userId,
  fullName: input.fullName ?? "",
  emailAddress: input.emailAddress ?? "",
  hasCompletedOnboarding: input.hasCompletedOnboarding === true,
  onboardingStep: input.onboardingStep ?? 0,
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

export const normalizeLearningPath = (input: Partial<ILearningPathResult>): ILearningPathResult => ({
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

export const normalizeGamificationSummary = (
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

export const normalizeProfileFieldSuggestions = (
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

export const normalizeUpsertInput = (input: IDeveloperProfile): IDeveloperProfile => ({
  completeOnboarding: input.completeOnboarding === true,
  onboardingStep: input.onboardingStep ?? 0,
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

export const normalizeDeveloperSearchResult = (
  input: Partial<IDeveloperSearchResult>,
): IDeveloperSearchResult => ({
  userName: input.userName ?? "",
  displayName: input.displayName ?? "",
  avatarUrl: input.avatarUrl ?? "",
  githubUsername: input.githubUsername ?? "",
  skillTags: input.skillTags ?? [],
  yearsOfExperience: input.yearsOfExperience,
});

export const normalizeDeveloperSearchResults = (input: unknown): IDeveloperSearchResult[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item) =>
    normalizeDeveloperSearchResult(item as Partial<IDeveloperSearchResult>),
  );
};

export const normalizePublicProject = (
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

export const normalizePublicProfile = (
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

