import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IdeatorProvider, useIdeatorAction, useIdeatorState } from "..";
import type { IIdeaPost } from "../context";
const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }));
vi.mock("@/utils/axiosInstance", () => ({ getAxiosInstance: () => api }));
const idea = { id: "idea-1", title: "Community study notes", comments: [], isPublic: false } as unknown as IIdeaPost;
const ok = (result: unknown) => ({ data: { result } });
const setup = () => renderHook(() => ({ actions: useIdeatorAction(), state: useIdeatorState() }), { wrapper: IdeatorProvider });
beforeEach(() => { vi.resetAllMocks(); api.get.mockResolvedValue(ok([idea])); api.post.mockResolvedValue(ok(idea)); });
afterEach(cleanup);

describe("Ideator provider", () => {
  it("loads and unwraps the feed", async () => {
    const { result } = setup();
    await act(() => result.current.actions.fetchFeed());
    expect(result.current.state.ideas).toEqual([idea]);
    expect(api.get).toHaveBeenCalledWith("/api/services/app/Ideator/GetFeed");
  });
  it("preserves loaded ideas when refreshing fails", async () => {
    const { result } = setup();
    await act(() => result.current.actions.fetchFeed());
    api.get.mockRejectedValue(new Error("offline"));
    await act(async () => { await expect(result.current.actions.fetchFeed()).rejects.toThrow("offline"); });
    expect(result.current.state).toMatchObject({ ideas: [idea], isError: true, isPending: false });
  });
  it("sends a private idea and refreshes the feed", async () => {
    const { result } = setup();
    const input = { title: "Study notes", problemStatement: "Lost notes", proposedSolution: "Shared notebook", isPublic: false };
    await act(() => result.current.actions.createIdea(input));
    expect(api.post).toHaveBeenCalledWith("/api/services/app/Ideator/CreateIdea", input);
    expect(result.current.state.ideas).toEqual([idea]);
  });
  it("rejects failed writes without pretending they were saved", async () => {
    api.post.mockRejectedValue(new Error("not saved"));
    const { result } = setup();
    await act(async () => { await expect(result.current.actions.createIdea({ title: "A", problemStatement: "B", proposedSolution: "C", isPublic: true })).rejects.toThrow("not saved"); });
    expect(api.get).not.toHaveBeenCalled();
    expect(result.current.state).toMatchObject({ isError: true, ideas: [] });
  });
  it("retains a confirmed save when the subsequent feed request fails", async () => {
    api.get.mockRejectedValue(new Error("refresh failed"));
    const { result } = setup();
    await act(() => result.current.actions.createIdea({ title: "A", problemStatement: "B", proposedSolution: "C", isPublic: true }));
    expect(result.current.state).toMatchObject({ isError: true, isPending: false, ideas: [idea] });
    expect(api.post).toHaveBeenCalledTimes(1);
  });
  it("returns a converted project even if feed refresh fails", async () => {
    const converted = { ...idea, isConverted: true, convertedProjectId: "project-1" };
    api.post.mockResolvedValue(ok(converted)); api.get.mockRejectedValue(new Error("offline"));
    const { result } = setup();
    await act(async () => { expect(await result.current.actions.convert("idea-1", false)).toEqual(converted); });
    expect(api.post).toHaveBeenCalledWith("/api/services/app/Ideator/ConvertToProject", { ideaPostId: "idea-1", inviteInterestedDevelopers: false });
    expect(result.current.state.ideas[0].convertedProjectId).toBe("project-1");
  });
  it("rejects a denied conversion and retains the original idea", async () => {
    const { result } = setup();
    await act(() => result.current.actions.fetchFeed());
    api.post.mockRejectedValue(new Error("Only the creator can convert this idea"));
    await act(async () => { await expect(result.current.actions.convert("idea-1", true)).rejects.toThrow("Only the creator"); });
    expect(result.current.state.ideas).toEqual([idea]);
    expect(result.current.state.ideas[0].convertedProjectId).toBeUndefined();
    expect(result.current.state.isError).toBe(true);
  });
  it.each(["react", "comment"] as const)("refreshes after %s and propagates write errors", async (action) => {
    const { result } = setup();
    const invoke = () => action === "react" ? result.current.actions.react("idea-1", "Interested") : result.current.actions.comment("idea-1", "Helpful suggestion");
    await act(invoke);
    expect(api.get).toHaveBeenCalledTimes(1);
    api.post.mockRejectedValue(new Error("offline"));
    await act(async () => { await expect(invoke()).rejects.toThrow("offline"); });
    expect(result.current.state.isError).toBe(true);
  });
  it("keeps confirmed deletion when refresh fails and rejects failed deletion", async () => {
    const { result } = setup(); await act(() => result.current.actions.fetchFeed());
    api.get.mockRejectedValue(new Error("offline")); api.delete.mockResolvedValue(ok(undefined));
    await act(() => result.current.actions.deleteIdea("idea-1"));
    expect(result.current.state.ideas).toEqual([]);
    api.delete.mockRejectedValue(new Error("not removed"));
    await act(async () => { await expect(result.current.actions.deleteIdea("idea-1")).rejects.toThrow("not removed"); });
  });
});
