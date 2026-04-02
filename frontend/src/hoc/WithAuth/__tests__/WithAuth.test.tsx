import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WithAuth } from "../WithAuth";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  useRouter: vi.fn(),
  useAuthState: vi.fn(),
  useTenantResolutionState: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: mocks.useRouter,
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuthState: mocks.useAuthState,
}));

vi.mock("@/providers/tenant-provider", () => ({
  useTenantResolutionState: mocks.useTenantResolutionState,
}));

const ProtectedAuthPage = () => <div>auth page</div>;
const GuardedAuthPage = WithAuth(ProtectedAuthPage);

describe("WithAuth", () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.useRouter.mockReturnValue({
      replace: mocks.replace,
    });
  });

  it("shows loader while auth bootstrap is pending", () => {
    mocks.useTenantResolutionState.mockReturnValue({
      isResolved: false,
      isPending: true,
    });
    mocks.useAuthState.mockReturnValue({
      isAuthenticated: false,
      isPending: false,
    });

    render(<GuardedAuthPage />);

    expect(screen.getByTestId("with-auth-loader")).toBeInTheDocument();
  });

  it("redirects authenticated users to app", async () => {
    mocks.useTenantResolutionState.mockReturnValue({
      isResolved: true,
      isPending: false,
    });
    mocks.useAuthState.mockReturnValue({
      isAuthenticated: true,
      isPending: false,
    });

    render(<GuardedAuthPage />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/app");
    });
  });

  it("renders wrapped auth page for unauthenticated users", () => {
    mocks.useTenantResolutionState.mockReturnValue({
      isResolved: true,
      isPending: false,
    });
    mocks.useAuthState.mockReturnValue({
      isAuthenticated: false,
      isPending: false,
    });

    render(<GuardedAuthPage />);

    expect(screen.getByText("auth page")).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
