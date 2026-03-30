import { describe, expect, it } from "vitest";
import {
  fetchLevelsSuccess,
  fetchGamificationPending,
  fetchGamificationSuccess,
  fetchLearningPathPending,
  fetchLearningPathSuccess,
  fetchProfileSuccess,
  fetchUserSuccess,
  saveProfileSuccess,
  scanGithubSuccess,
} from "../actions";
import { INITIAL_STATE } from "../context";
import { DeveloperReducer } from "../reducer";

const profile = {
  githubUsername: "octocat",
  avatarUrl: "https://example.com/avatar.png",
  yearsOfExperience: 3,
  yearOfStudy: 2,
  studyLevel: 1,
  bio: "Bio",
  location: "Cape Town",
  teamworkRating: 7.5,
  skills: ["React", "Node"],
  goals: ["Leadership"],
};

describe("DeveloperReducer", () => {
  it("updates profile and levels", () => {
    const profileState = DeveloperReducer(INITIAL_STATE, fetchProfileSuccess(profile));
    expect(profileState.profile.githubUsername).toBe("octocat");
    expect(profileState.isSuccess).toBe(true);

    const levelsState = DeveloperReducer(
      profileState,
      fetchLevelsSuccess([{ value: 1, label: "Diploma" }]),
    );
    expect(levelsState.studyLevels).toHaveLength(1);
    expect(levelsState.studyLevels[0].label).toBe("Diploma");
  });

  it("updates current user and scan result", () => {
    const userState = DeveloperReducer(
      INITIAL_STATE,
      fetchUserSuccess({
        id: 33,
        userName: "octo",
        name: "Octo",
        surname: "Cat",
        emailAddress: "octo@example.com",
      }),
    );
    expect(userState.currentUser?.id).toBe(33);

    const scanState = DeveloperReducer(
      userState,
      scanGithubSuccess({
        score: 79,
        insights: ["Good consistency on profile completion."],
      }),
    );
    expect(scanState.scanResult?.score).toBe(79);
    expect(scanState.scanResult?.insights[0]).toContain("consistency");
  });

  it("updates profile on save success", () => {
    const state = DeveloperReducer(INITIAL_STATE, saveProfileSuccess(profile));
    expect(state.profile.goals).toContain("Leadership");
    expect(state.profile.skills).toContain("Node");
  });

  it("updates learning path state", () => {
    const pendingState = DeveloperReducer(INITIAL_STATE, fetchLearningPathPending());
    expect(pendingState.isLearningPathPending).toBe(true);

    const successState = DeveloperReducer(
      pendingState,
      fetchLearningPathSuccess({
        source: "fallback",
        summary: "Generated from profile data.",
        marketSignals: ["Full-Stack Engineer: TypeScript, React"],
        recommendations: [
          {
            goal: "Become stronger in full-stack delivery",
            priority: "medium",
            estimatedWeeks: 8,
            gapSummary: "Close testing and API design gaps.",
            recommendedSkills: ["Testing", "API Design"],
            suggestedActions: ["Ship one feature with tests."],
          },
        ],
      }),
    );

    expect(successState.isLearningPathPending).toBe(false);
    expect(successState.learningPath?.recommendations).toHaveLength(1);
    expect(successState.learningPath?.source).toBe("fallback");
  });

  it("updates gamification state", () => {
    const pendingState = DeveloperReducer(INITIAL_STATE, fetchGamificationPending());
    expect(pendingState.isGamificationPending).toBe(true);

    const successState = DeveloperReducer(
      pendingState,
      fetchGamificationSuccess({
        totalPoints: 225,
        level: 3,
        nextLevelPoints: 300,
        progressPercent: 25,
        badges: [
          {
            code: "project_finisher",
            name: "Project Finisher",
            description: "Completed first project",
            earnedAt: "2026-03-30T00:00:00.000Z",
          },
        ],
        recentEvents: [
          {
            eventType: "project_completed_lead",
            pointsAwarded: 60,
            occurredAt: "2026-03-30T00:00:00.000Z",
          },
        ],
      }),
    );

    expect(successState.isGamificationPending).toBe(false);
    expect(successState.gamificationSummary?.level).toBe(3);
    expect(successState.gamificationSummary?.badges[0].code).toBe("project_finisher");
  });
});
