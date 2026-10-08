import { describe, expect, it } from "vitest";
import {
  fetchLevelsSuccess,
  fetchProfileSuccess,
  saveSuccess,
} from "../actions";
import { INITIAL_STATE } from "../context";
import { DeveloperOnboardingReducer } from "../reducer";

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

describe("DeveloperOnboardingReducer", () => {
  it("updates state for profile and levels", () => {
    const profileState = DeveloperOnboardingReducer(
      INITIAL_STATE,
      fetchProfileSuccess(profile),
    );

    expect(profileState.profile.githubUsername).toBe("octocat");
    expect(profileState.isSuccess).toBe(true);

    const levelsState = DeveloperOnboardingReducer(
      profileState,
      fetchLevelsSuccess([{ value: 0, label: "HighSchool" }]),
    );

    expect(levelsState.studyLevels).toHaveLength(1);
  });

  it("updates state for save success", () => {
    const state = DeveloperOnboardingReducer(INITIAL_STATE, saveSuccess(profile));

    expect(state.profile.goals).toContain("Leadership");
    expect(state.isError).toBe(false);
  });
});
