import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AppearanceProvider,
  useAppearanceAction,
  useAppearanceState,
} from "..";

const Consumer = () => {
  const { mode, isHydrated } = useAppearanceState();
  const { hydrateMode, toggleMode } = useAppearanceAction();

  return (
    <div>
      <div data-testid="mode">{mode}</div>
      <div data-testid="hydrated">{String(isHydrated)}</div>
      <button onClick={hydrateMode} type="button">
        Hydrate
      </button>
      <button onClick={toggleMode} type="button">
        Toggle
      </button>
    </div>
  );
};

describe("AppearanceProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.setAttribute("data-theme", "dark");
  });

  afterEach(() => {
    cleanup();
  });

  it("hydrates from localStorage and applies document theme", async () => {
    window.localStorage.setItem("mosaic-talent.theme-mode", "light");

    render(
      <AppearanceProvider>
        <Consumer />
      </AppearanceProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hydrate" }));

    await waitFor(() => {
      expect(screen.getByTestId("mode")).toHaveTextContent("light");
      expect(screen.getByTestId("hydrated")).toHaveTextContent("true");
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("starts light and toggles to dark mode", async () => {
    render(
      <AppearanceProvider>
        <Consumer />
      </AppearanceProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));

    await waitFor(() => {
      expect(screen.getByTestId("mode")).toHaveTextContent("dark");
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(window.localStorage.getItem("mosaic-talent.theme-mode")).toBe("dark");
  });
});
