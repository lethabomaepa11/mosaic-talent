import { describe, expect, it } from "vitest";
import { fetchProfileSuccess, saveProfileSuccess } from "../actions";
import { INITIAL_STATE } from "../context";
import { CompanyProfileReducer } from "../reducer";

const profile = {
  userId: 7,
  name: "Ava",
  surname: "Stone",
  userName: "ava.stone",
  emailAddress: "ava@company.com",
  avatarUrl: "https://cdn.example.com/avatar.png",
  role: 1,
};

describe("CompanyProfileReducer", () => {
  it("stores fetched profile", () => {
    const state = CompanyProfileReducer(INITIAL_STATE, fetchProfileSuccess(profile));
    expect(state.profile?.emailAddress).toBe("ava@company.com");
    expect(state.isSuccess).toBe(true);
  });

  it("stores saved profile", () => {
    const state = CompanyProfileReducer(INITIAL_STATE, saveProfileSuccess(profile));
    expect(state.profile?.avatarUrl).toContain("avatar.png");
  });
});
