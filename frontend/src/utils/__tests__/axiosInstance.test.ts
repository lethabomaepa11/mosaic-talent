import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAccessTokenFromApi } from "../axiosInstance";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    create: vi.fn(),
  },
  get: vi.fn(),
  create: vi.fn(),
}));

describe("fetchAccessTokenFromApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests access token with credentials", async () => {
    const mockGet = vi.mocked(axios.get);
    mockGet.mockResolvedValueOnce({
      data: {
        result: "oauth-token",
      },
    } as never);

    const token = await fetchAccessTokenFromApi();

    expect(token).toBe("oauth-token");
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining("/api/TokenAuth/GetAccessToken"),
      { withCredentials: true },
    );
  });

  it("returns empty string when request fails", async () => {
    const mockGet = vi.mocked(axios.get);
    mockGet.mockRejectedValueOnce(new Error("network"));

    const token = await fetchAccessTokenFromApi();

    expect(token).toBe("");
  });
});
