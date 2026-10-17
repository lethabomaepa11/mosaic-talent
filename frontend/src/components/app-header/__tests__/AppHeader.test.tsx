import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { AuthStateContext, INITIAL_STATE } from "@/providers/auth-provider/context";
import { AppHeader } from "@/components/app-header";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

const mocks = vi.hoisted(() => ({
  useDeveloperState: vi.fn(),
  useDeveloperAction: vi.fn(),
  useCompanyProfileState: vi.fn(),
  useTenantResolutionState: vi.fn(),
  useAppearanceState: vi.fn(),
  useAppearanceAction: vi.fn(),
  useProjectState: vi.fn(),
}));

vi.mock("@/providers/developer-provider", () => ({
  useDeveloperState: mocks.useDeveloperState,
  useDeveloperAction: mocks.useDeveloperAction,
}));

vi.mock("@/providers/company-profile-provider", () => ({
  useCompanyProfileState: mocks.useCompanyProfileState,
}));

vi.mock("@/providers/tenant-provider", () => ({
  useTenantResolutionState: mocks.useTenantResolutionState,
}));

vi.mock("@/providers/appearance-provider", () => ({
  useAppearanceState: mocks.useAppearanceState,
  useAppearanceAction: mocks.useAppearanceAction,
}));

vi.mock("@/providers/project-provider", () => ({
  useProjectState: mocks.useProjectState,
}));

vi.mock("@/components/notification-center", () => ({
  NotificationCenter: ({ buttonAriaLabel }: { buttonAriaLabel: string }) => (
    <button type="button">{buttonAriaLabel}</button>
  ),
}));

describe("AppHeader", () => {
  beforeAll(() => {
    mocks.useDeveloperState.mockReturnValue({
      currentUser: undefined,
      profile: { avatarUrl: "" },
    });
    mocks.useDeveloperAction.mockReturnValue({
      searchPublicDevelopers: vi.fn().mockResolvedValue([]),
    });
    mocks.useCompanyProfileState.mockReturnValue({
      profile: undefined,
    });
    mocks.useTenantResolutionState.mockReturnValue({
      tenancyName: "",
    });
    mocks.useAppearanceState.mockReturnValue({
      mode: "dark",
    });
    mocks.useAppearanceAction.mockReturnValue({
      toggleMode: vi.fn(),
    });
    mocks.useProjectState.mockReturnValue({
      myProjects: [],
      openProjects: [],
      isPending: false,
      isSuccess: true,
      isError: false,
      selectedProject: undefined,
      lastMatch: undefined,
    });
  });

  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    class ResizeObserverMock {
      observe() {
        return undefined;
      }

      unobserve() {
        return undefined;
      }

      disconnect() {
        return undefined;
      }
    }

    window.ResizeObserver = ResizeObserverMock;
  });

  it("renders with search and action controls", () => {
    render(<AppHeader />);

    expect(
      screen.getByPlaceholderText("Search developers and projects..."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "User menu" })).toBeInTheDocument();
  });

  it("renders initials from fallback user name", () => {
    render(
      <AuthStateContext.Provider
        value={{
          ...INITIAL_STATE,
          user: { userId: 72, accessToken: "token", expireInSeconds: 1200 },
        }}
      >
        <AppHeader />
      </AuthStateContext.Provider>,
    );

    expect(screen.getByText("U7")).toBeInTheDocument();
  });
});
