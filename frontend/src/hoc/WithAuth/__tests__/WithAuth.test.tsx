import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  afterEach(cleanup);
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.useAuthState.mockReturnValue({ isAuthenticated: false, isSessionRestored: true, isPending: false });
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
      isSessionRestored: true,
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
      isSessionRestored: true,
      isPending: false,
    });

    render(<GuardedAuthPage />);

    expect(screen.getByText("auth page")).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("keeps form values mounted during a submission and its failure", () => {
    mocks.useTenantResolutionState.mockReturnValue({ isResolved: true, isPending: false });
    const FormPage = WithAuth(() => <input aria-label="Email" />);
    const { rerender } = render(<FormPage />);
    const input = screen.getByRole("textbox", { name: "Email" });
    fireEvent.change(input, { target: { value: "developer@example.com" } });
    mocks.useAuthState.mockReturnValue({ isAuthenticated: false, isSessionRestored: true, isPending: true });
    rerender(<FormPage />);
    expect(screen.getByRole("textbox", { name: "Email" })).toBe(input);
    expect(input).toHaveValue("developer@example.com");
    mocks.useAuthState.mockReturnValue({ isAuthenticated: false, isSessionRestored: true, isPending: false, isError: true });
    rerender(<FormPage />);
    expect(screen.getByRole("textbox", { name: "Email" })).toBe(input);
    expect(input).toHaveValue("developer@example.com");
  });

  it("waits for initial restoration even before its pending flag is set", () => {
    mocks.useTenantResolutionState.mockReturnValue({ isResolved: true, isPending: false });
    mocks.useAuthState.mockReturnValue({ isAuthenticated: false, isSessionRestored: false, isPending: false });
    render(<GuardedAuthPage />);
    expect(screen.getByTestId("with-auth-loader")).toBeInTheDocument();
  });
});
