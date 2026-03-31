import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceRouteGuard } from "../WorkspaceRouteGuard";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  useRouter: vi.fn(),
  useTenantResolutionState: vi.fn(),
  useTenantResolutionAction: vi.fn(),
  resolveTenant: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: mocks.useRouter,
}));

vi.mock("@/providers/tenant-provider", () => ({
  useTenantResolutionState: mocks.useTenantResolutionState,
  useTenantResolutionAction: mocks.useTenantResolutionAction,
}));

describe("WorkspaceRouteGuard", () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.resolveTenant.mockReset();
    mocks.useRouter.mockReturnValue({
      replace: mocks.replace,
    });
    mocks.useTenantResolutionAction.mockReturnValue({
      resolveTenant: mocks.resolveTenant,
    });
  });

  it("allows company routes for company tenants", () => {
    mocks.useTenantResolutionState.mockReturnValue({
      tenancyName: "acme",
      isResolved: true,
      isPending: false,
    });

    render(
      <WorkspaceRouteGuard audience="company">
        <div>company content</div>
      </WorkspaceRouteGuard>,
    );

    expect(screen.getByText("company content")).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("redirects developer users away from company routes", async () => {
    mocks.useTenantResolutionState.mockReturnValue({
      tenancyName: "",
      isResolved: true,
      isPending: false,
    });

    render(
      <WorkspaceRouteGuard audience="company">
        <div>company content</div>
      </WorkspaceRouteGuard>,
    );

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/app/projects/open");
    });
  });

  it("allows developer routes for default tenant users", () => {
    mocks.useTenantResolutionState.mockReturnValue({
      tenancyName: "",
      isResolved: true,
      isPending: false,
    });

    render(
      <WorkspaceRouteGuard audience="developer">
        <div>developer content</div>
      </WorkspaceRouteGuard>,
    );

    expect(screen.getByText("developer content")).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("redirects company users away from developer routes", async () => {
    mocks.useTenantResolutionState.mockReturnValue({
      tenancyName: "acme",
      isResolved: true,
      isPending: false,
    });

    render(
      <WorkspaceRouteGuard audience="developer">
        <div>developer content</div>
      </WorkspaceRouteGuard>,
    );

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/app");
    });
  });
});
