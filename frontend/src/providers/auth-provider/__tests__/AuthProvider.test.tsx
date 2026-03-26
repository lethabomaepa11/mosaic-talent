import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuthAction, useAuthState } from "..";
import type { IRegisterInput } from "../context";

const mocks = vi.hoisted(() => ({
  getAuthToken: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  removeAuthToken: vi.fn(),
  setAuthToken: vi.fn(),
}));

vi.mock("@/utils/axiosInstance", () => ({
  getAxiosInstance: () => ({
    get: mocks.get,
    post: mocks.post,
  }),
  setAuthToken: mocks.setAuthToken,
  removeAuthToken: mocks.removeAuthToken,
  getAuthToken: mocks.getAuthToken,
}));

const registerInput: IRegisterInput = {
  emailAddress: "jane@example.com",
  name: "Jane",
  password: "Secret123!",
  surname: "Doe",
  userName: "jane.doe",
};

function Consumer() {
  const { isAuthenticated, isError, isPending, user } = useAuthState();
  const { login, logout, register } = useAuthAction();

  return (
    <div>
      <div data-testid="auth-state">
        {JSON.stringify({
          isAuthenticated,
          isError,
          isPending,
          userId: user?.userId,
        })}
      </div>
      <button onClick={() => login("admin", "Admin@123")} type="button">
        Login
      </button>
      <button onClick={() => register(registerInput)} type="button">
        Register
      </button>
      <button onClick={() => logout()} type="button">
        Logout
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.post.mockReset();
    mocks.get.mockReset();
    mocks.setAuthToken.mockReset();
    mocks.removeAuthToken.mockReset();
    mocks.getAuthToken.mockReset();
    mocks.getAuthToken.mockReturnValue("");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("restores a persisted session on mount", async () => {
    mocks.getAuthToken.mockReturnValue("saved-token");
    mocks.get.mockResolvedValueOnce({
      data: {
        result: {
          user: { id: 99 },
        },
      },
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent('"userId":99');
    });
    expect(mocks.get).toHaveBeenCalledWith(
      "/api/services/app/Session/GetCurrentLoginInformations",
    );
  });

  it("logs in successfully and persists the session", async () => {
    mocks.post.mockResolvedValueOnce({
      data: {
        result: {
          accessToken: "token-123",
          expireInSeconds: 3600,
          userId: 7,
        },
      },
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent('"userId":7');
    });

    expect(mocks.post).toHaveBeenCalledWith("/api/TokenAuth/Authenticate", {
      password: "Admin@123",
      rememberClient: true,
      userNameOrEmailAddress: "admin",
    });
    expect(mocks.setAuthToken).toHaveBeenCalledWith("token-123");
  });

  it("registers successfully and auto-authenticates", async () => {
    mocks.post
      .mockResolvedValueOnce({
        data: {
          result: {},
        },
      })
      .mockResolvedValueOnce({
        data: {
          result: {
            accessToken: "register-token",
            expireInSeconds: 3600,
            userId: 14,
          },
        },
      });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent('"userId":14');
    });

    expect(mocks.post).toHaveBeenNthCalledWith(
      1,
      "/api/services/app/Account/Register",
      registerInput,
    );
    expect(mocks.post).toHaveBeenNthCalledWith(2, "/api/TokenAuth/Authenticate", {
      password: "Secret123!",
      rememberClient: true,
      userNameOrEmailAddress: "jane.doe",
    });
  });

  it("sets an error state when login fails", async () => {
    mocks.post.mockRejectedValueOnce(new Error("Invalid credentials"));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent('"isError":true');
    });

    expect(mocks.removeAuthToken).toHaveBeenCalledTimes(1);
  });

  it("clears the session on logout", async () => {
    mocks.getAuthToken.mockReturnValue("saved-token");
    mocks.get.mockResolvedValueOnce({
      data: {
        result: {
          user: { id: 99 },
        },
      },
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent('"userId":99');
    });

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent('"isAuthenticated":false');
    });

    expect(mocks.removeAuthToken).toHaveBeenCalledTimes(1);
  });
});
