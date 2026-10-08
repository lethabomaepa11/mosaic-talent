import { describe, expect, it } from "vitest";
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
} from "../actions";

const profile = {
  githubUsername: "octocat",
  avatarUrl: "",
  yearsOfExperience: 3,
  yearOfStudy: 2,
  studyLevel: 1,
  bio: "bio",
  location: "Cape Town",
  teamworkRating: 8,
  skills: ["TypeScript"],
  goals: ["Leadership"],
};

describe("developer onboarding actions", () => {
  it("creates fetch lifecycle payloads", () => {
    expect(fetchProfilePending()).toMatchObject({
      payload: { isPending: true, isSuccess: false, isError: false },
    });

    expect(fetchProfileSuccess(profile)).toMatchObject({
      payload: {
        isPending: false,
        isSuccess: true,
        isError: false,
        profile,
      },
    });

    expect(fetchProfileError()).toMatchObject({
      payload: { isPending: false, isSuccess: false, isError: true },
    });
  });

  it("creates levels and save payloads", () => {
    expect(fetchLevelsPending()).toMatchObject({
      payload: { isPending: true, isSuccess: false, isError: false },
    });

    expect(fetchLevelsSuccess([{ value: 0, label: "HighSchool" }])).toMatchObject({
      payload: {
        isPending: false,
        isSuccess: true,
        isError: false,
        studyLevels: [{ value: 0, label: "HighSchool" }],
      },
    });

    expect(fetchLevelsError()).toMatchObject({
      payload: { isPending: false, isSuccess: false, isError: true },
    });

    expect(savePending()).toMatchObject({
      payload: { isPending: true, isSuccess: false, isError: false },
    });

    expect(saveSuccess(profile)).toMatchObject({
      payload: {
        isPending: false,
        isSuccess: true,
        isError: false,
        profile,
      },
    });

    expect(saveError()).toMatchObject({
      payload: { isPending: false, isSuccess: false, isError: true },
    });
  });
});
