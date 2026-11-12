import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SupportProvider, useSupportAction, useSupportState } from "..";
import { loadTawk } from "../tawk";
import { openError, openPending, openSuccess } from "../actions";
import { SupportReducer } from "../reducer";
import { INITIAL_STATE } from "../context";

vi.mock("../tawk", async importOriginal => ({
  ...await importOriginal<typeof import("../tawk")>(), loadTawk: vi.fn(),
}));
const useSupport = () => ({ ...useSupportState(), ...useSupportAction() });

describe("support provider", () => {
  beforeEach(() => { vi.mocked(loadTawk).mockReset(); });
  afterEach(() => vi.unstubAllEnvs());

  it("loads on demand and opens the configured widget", async () => {
    const showWidget = vi.fn(), maximize = vi.fn();
    vi.mocked(loadTawk).mockResolvedValue({ showWidget, maximize });
    const { result } = renderHook(useSupport, { wrapper: SupportProvider });
    expect(loadTawk).not.toHaveBeenCalled();
    await act(async () => { expect(await result.current.openSupport()).toBe(true); });
    expect(showWidget).toHaveBeenCalledOnce(); expect(maximize).toHaveBeenCalledOnce();
    expect(result.current.isSuccess).toBe(true);
  });

  it("keeps errors actionable and permits retry", async () => {
    vi.mocked(loadTawk).mockRejectedValueOnce(new Error("blocked"));
    const { result } = renderHook(useSupport, { wrapper: SupportProvider });
    await act(async () => { expect(await result.current.openSupport()).toBe(false); });
    expect(result.current.error).toContain("allow tawk.to");
    vi.mocked(loadTawk).mockResolvedValue({ showWidget: vi.fn(), maximize: vi.fn() });
    await act(async () => { await result.current.openSupport(); });
    expect(result.current.error).toBeUndefined();
    expect(result.current.isSuccess).toBe(true);
  });

  it("does not load any script for missing or invalid explicit configuration", async () => {
    vi.stubEnv("NEXT_PUBLIC_TAWK_EMBED_URL", "");
    const { result } = renderHook(useSupport, { wrapper: SupportProvider });
    await act(async () => { expect(await result.current.openSupport()).toBe(false); });
    expect(loadTawk).not.toHaveBeenCalled();
    expect(result.current.error).toContain("isn't available");
  });

  it("reduces pending, error and success actions without retaining stale errors", () => {
    let state = SupportReducer(INITIAL_STATE, openError("blocked"));
    expect(state).toMatchObject({ isError: true, error: "blocked" });
    state = SupportReducer(state, openPending());
    expect(state).toMatchObject({ isPending: true, isError: false, error: undefined });
    state = SupportReducer(state, openSuccess());
    expect(state).toMatchObject({ isPending: false, isSuccess: true });
  });
});
