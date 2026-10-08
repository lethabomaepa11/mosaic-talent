import { describe, expect, it } from "vitest";
import {
  fetchLevelsSuccess,
  fetchGamificationSuccess,
  fetchLearningPathSuccess,
  fetchProfileSuccess,
  fetchUserSuccess,
  saveProfileSuccess,
  scanGithubSuccess,
} from "../actions";

const profile = {
  githubUsername: "octocat",
  avatarUrl: "https://example.com/avatar.png",
  yearsOfExperience: 3,
  yearOfStudy: 2,
  studyLevel: 1,
  bio: "Bio",
  location: "Cape Town",
  teamworkRating: 7.5,
  skills: ["React"],
  goals: ["Communication"],
};

describe("developer-provider actions", () => {
  it("creates profile payload actions", () => {
    expect(fetchProfileSuccess(profile)).toMatchObject({
      payload: {
        profile,
        isPending: false,
        isSuccess: true,
        isError: false,
      },
    });
    expect(saveProfileSuccess(profile)).toMatchObject({
      payload: {
        profile,
        isPending: false,
        isSuccess: true,
        isError: false,
      },
    });
  });

  it("creates levels and user payload actions", () => {
    expect(fetchLevelsSuccess([{ value: 1, label: "Diploma" }])).toMatchObject({
      payload: {
        studyLevels: [{ value: 1, label: "Diploma" }],
        isPending: false,
        isSuccess: true,
        isError: false,
      },
    });
    expect(
      fetchUserSuccess({
        id: 12,
        userName: "octo",
        name: "Octo",
        surname: "Cat",
        emailAddress: "octo@example.com",
      }),
    ).toMatchObject({
      payload: {
        currentUser: {
          id: 12,
          userName: "octo",
          name: "Octo",
          surname: "Cat",
          emailAddress: "octo@example.com",
        },
        isPending: false,
        isSuccess: true,
        isError: false,
      },
    });
  });

  it("creates github scan payload action", () => {
    expect(
      scanGithubSuccess({
        score: 83,
        insights: ["Profile scan complete."],
      }),
    ).toMatchObject({
      payload: {
        scanResult: {
          score: 83,
          insights: ["Profile scan complete."],
        },
        isPending: false,
        isSuccess: true,
        isError: false,
      },
    });
  });

  it("creates learning path payload action", () => {
    expect(
      fetchLearningPathSuccess({
        source: "ai",
        summary: "Path summary",
        marketSignals: ["Backend Engineer: .NET, API Design"],
        recommendations: [
          {
            goal: "Lead backend services",
            priority: "high",
            estimatedWeeks: 10,
            gapSummary: "Strengthen API design depth.",
            recommendedSkills: ["API Design", "Testing"],
            suggestedActions: ["Build one API module with tests."],
          },
        ],
      }),
    ).toMatchObject({
      payload: {
        isLearningPathPending: false,
        learningPath: {
          source: "ai",
          summary: "Path summary",
          recommendations: [
            {
              goal: "Lead backend services",
            },
          ],
        },
      },
    });
  });

  it("creates gamification payload action", () => {
    expect(
      fetchGamificationSuccess({
        totalPoints: 180,
        level: 2,
        nextLevelPoints: 200,
        progressPercent: 80,
        badges: [
          {
            code: "first_contribution",
            name: "First Contribution",
            description: "First point milestone",
            earnedAt: "2026-03-30T00:00:00.000Z",
          },
        ],
        recentEvents: [
          {
            eventType: "peer_review_completed",
            pointsAwarded: 30,
            occurredAt: "2026-03-30T00:00:00.000Z",
          },
        ],
      }),
    ).toMatchObject({
      payload: {
        isGamificationPending: false,
        gamificationSummary: {
          totalPoints: 180,
          level: 2,
          badges: [{ code: "first_contribution" }],
        },
      },
    });
  });
});
