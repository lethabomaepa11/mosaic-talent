import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { AuthStateContext, INITIAL_STATE } from "@/providers/auth-provider/context";
import { AppHeader } from "@/components/app-header";

describe("AppHeader", () => {
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
      screen.getByPlaceholderText("Search projects, reviews, simulations..."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "User menu" })).toBeInTheDocument();
  });

  it("calls toggle callback with next mode", () => {
    const onToggleViewMode = vi.fn();

    render(<AppHeader onToggleViewMode={onToggleViewMode} />);

    const toggleButtons = screen.getAllByRole("button", {
      name: "Toggle view mode",
    });
    toggleButtons.forEach((button) => {
      fireEvent.click(button);
    });
    expect(onToggleViewMode).toHaveBeenCalledWith("company");
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
