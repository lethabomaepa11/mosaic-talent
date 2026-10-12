import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeveloperProvider, useDeveloperAction, useDeveloperState } from "..";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("@/utils/axiosInstance", () => ({ getAxiosInstance: () => api }));
const useDeveloper = () => ({ actions: useDeveloperAction(), state: useDeveloperState() });
const profile = { userId: 99, fullName: "Jane Doe", emailAddress: "jane@example.com", githubUsername: "", studyLevel: 0,
  skills: ["Python"], goals: [], hasCompletedOnboarding: false, onboardingStep: 2 };

describe("onboarding provider actions", () => {
  beforeEach(() => { api.get.mockReset(); api.post.mockReset(); });
  it("saves and completes a profile without GitHub", async () => {
    api.post.mockResolvedValueOnce({ data: { result: { ...profile, hasCompletedOnboarding: true } } });
    const { result } = renderHook(useDeveloper, { wrapper: DeveloperProvider });
    await act(() => result.current.actions.upsertMyProfile({ ...profile, completeOnboarding: true }));
    expect(api.post).toHaveBeenCalledWith("/api/services/app/DeveloperOnboarding/UpsertMyProfile", expect.objectContaining({ githubUsername: "", completeOnboarding: true }));
    expect(result.current.state.profile.hasCompletedOnboarding).toBe(true);
  });
  it("reports load failures independently of other profile requests", async () => {
    api.get.mockRejectedValueOnce(new Error("Unavailable"));
    const { result } = renderHook(useDeveloper, { wrapper: DeveloperProvider });
    await act(() => result.current.actions.fetchMyProfile());
    expect(result.current.state.profileStatus).toBe("error");
  });
  it("retains account identity and completion metadata when loading", async () => {
    api.get.mockResolvedValueOnce({ data: { result: profile } });
    const { result } = renderHook(useDeveloper, { wrapper: DeveloperProvider });
    await act(() => result.current.actions.fetchMyProfile());
    expect(result.current.state.profile).toMatchObject(profile);
    await waitFor(() => expect(result.current.state.profileStatus).toBe("ready"));
  });
  it("rejects failed saves and GitHub imports", async () => {
    api.post.mockRejectedValueOnce(new Error("Unavailable"));
    api.get.mockRejectedValueOnce(new Error("Unavailable"));
    const { result } = renderHook(useDeveloper, { wrapper: DeveloperProvider });
    await act(async () => { await expect(result.current.actions.upsertMyProfile(profile)).rejects.toThrow("Failed to save"); });
    await expect(result.current.actions.getGithubSkillSuggestions()).rejects.toThrow("manually");
  });
});
