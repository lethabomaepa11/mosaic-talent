import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuthAction, useAuthState } from "..";

const api = vi.hoisted(() => ({ post: vi.fn(), setToken: vi.fn() }));
vi.mock("@/utils/axiosInstance", () => ({
  getAxiosInstance: () => ({ post: api.post }), getAuthToken: () => "",
  fetchAccessTokenFromApi: async () => "", removeAuthToken: vi.fn(),
  setAuthToken: api.setToken, setAbpTenantId: vi.fn(),
}));
vi.mock("@/providers/tenant-provider", () => ({ useTenantResolutionState: () => ({ isResolved: true }) }));

const input = { fullName: "Jane Doe", emailAddress: "jane@example.com", password: "Strong123!" };
const useAuth = () => ({ actions: useAuthAction(), state: useAuthState() });

describe("registration and GitHub connection actions", () => {
  beforeEach(() => { vi.clearAllMocks(); api.post.mockReset(); });

  it("authenticates a full-name registration by email", async () => {
    api.post.mockResolvedValueOnce({ data: { result: { canLogin: true } } })
      .mockResolvedValueOnce({ data: { result: { accessToken: "token", userId: 12, expireInSeconds: 3600 } } });
    const { result } = renderHook(useAuth, { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.state.isSessionRestored).toBe(true));
    await act(() => result.current.actions.register(input));
    expect(result.current.state.isAuthenticated).toBe(true);
    expect(api.post).toHaveBeenNthCalledWith(2, "/api/TokenAuth/Authenticate", expect.objectContaining({ userNameOrEmailAddress: input.emailAddress }));
  });

  it.each(["registration", "authentication"])("rejects failed %s instead of allowing a success redirect", async (phase) => {
    if (phase === "authentication") api.post.mockResolvedValueOnce({ data: { result: { canLogin: true } } });
    api.post.mockRejectedValueOnce(new Error("Unavailable"));
    const { result } = renderHook(useAuth, { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.state.isSessionRestored).toBe(true));
    await act(async () => { await expect(result.current.actions.register(input)).rejects.toThrow("Unavailable"); });
    expect(result.current.state.isAuthenticated).toBe(false);
    expect(result.current.state.isError).toBe(true);
    expect(api.setToken).not.toHaveBeenCalled();
  });

  it("does not authenticate when the registered account cannot log in", async () => {
    api.post.mockResolvedValueOnce({ data: { result: { canLogin: false } } });
    const { result } = renderHook(useAuth, { wrapper: AuthProvider });
    await act(async () => { await expect(result.current.actions.register(input)).rejects.toThrow("cannot sign in yet"); });
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it("starts a cookie-bound GitHub connection through the authenticated endpoint", async () => {
    api.post.mockResolvedValueOnce({ data: { result: { authorizationUrl: "https://github.com/login/oauth/authorize?state=protected" } } });
    const { result } = renderHook(useAuth, { wrapper: AuthProvider });
    expect(await result.current.actions.beginGithubConnection("/onboarding")).toContain("state=protected");
    expect(api.post).toHaveBeenCalledWith("/api/TokenAuth/BeginGitHubConnection", { returnPath: "/onboarding" }, { withCredentials: true });
  });

  it("rejects unsafe authorization redirects", async () => {
    api.post.mockResolvedValueOnce({ data: { result: { authorizationUrl: "https://untrusted.example/" } } });
    const { result } = renderHook(useAuth, { wrapper: AuthProvider });
    await expect(result.current.actions.beginGithubConnection("/onboarding")).rejects.toThrow("unavailable");
  });
});
