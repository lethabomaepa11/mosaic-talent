import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingGuard } from "../OnboardingGuard";

const mocks = vi.hoisted(() => ({ replace: vi.fn(), fetch: vi.fn(), state: { profile: { userId: 99, hasCompletedOnboarding: false }, profileStatus: "ready" }, tenancyName: "" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("@/providers/auth-provider", () => ({ useAuthState: () => ({ isAuthenticated: true, user: { userId: 99 } }) }));
vi.mock("@/providers/tenant-provider", () => ({ useTenantResolutionState: () => ({ tenancyName: mocks.tenancyName }) }));
vi.mock("@/providers/developer-provider", () => ({ useDeveloperState: () => mocks.state, useDeveloperAction: () => ({ fetchMyProfile: mocks.fetch }) }));
vi.mock("../style", () => ({ useStyles: () => ({ styles: { loadingState: "loading" } }) }));

describe("developer onboarding guard", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.state.profile = { userId: 99, hasCompletedOnboarding: false }; mocks.state.profileStatus = "ready"; mocks.tenancyName = ""; });
  afterEach(cleanup);
  it("redirects incomplete developers and hides app content", async () => {
    render(<OnboardingGuard>Private page</OnboardingGuard>);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/onboarding"));
    expect(screen.queryByText("Private page")).not.toBeInTheDocument();
  });
  it("allows completed developers", () => {
    mocks.state.profile.hasCompletedOnboarding = true;
    render(<OnboardingGuard>Private page</OnboardingGuard>);
    expect(screen.getByText("Private page")).toBeVisible();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("does not use another account's cached completion", () => {
    mocks.state.profile = { userId: 100, hasCompletedOnboarding: true };
    render(<OnboardingGuard>Private page</OnboardingGuard>);
    expect(screen.queryByText("Private page")).not.toBeInTheDocument();
  });
  it("keeps company routes on their own guard", () => {
    mocks.tenancyName = "company";
    render(<OnboardingGuard>Company page</OnboardingGuard>);
    expect(screen.getByText("Company page")).toBeVisible();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
