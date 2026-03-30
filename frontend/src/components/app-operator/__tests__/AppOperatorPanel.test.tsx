import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppOperatorPanel } from "@/components/app-operator";
import { AppOperatorProvider } from "@/providers/app-operator-provider";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  plannerPost: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/jobs",
  useRouter: () => ({
    push: mocks.push,
  }),
}));

vi.mock("@/utils/axiosInstance", () => ({
  getAxiosInstance: () => ({
    post: mocks.plannerPost,
  }),
}));

describe("AppOperatorPanel", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.plannerPost.mockReset();
    mocks.plannerPost.mockRejectedValue(new Error("Planner unavailable"));
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("prompts for missing fields when required fields are absent", async () => {
    render(
      <AppOperatorProvider>
        <AppOperatorPanel />
      </AppOperatorProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /ai operator/i }));
    fireEvent.change(screen.getByPlaceholderText("Type a command..."), {
      target: { value: "Create a new user called Simon Manga" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send command" }));

    await waitFor(() => {
      expect(
        screen.getByText(/I need email, password before I can submit\./i),
      ).toBeInTheDocument();
    });
  });

  it("shows confirmation prompt for risky shortlist action", async () => {
    render(
      <AppOperatorProvider>
        <AppOperatorPanel />
      </AppOperatorProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /ai operator/i }));
    fireEvent.change(screen.getByPlaceholderText("Type a command..."), {
      target: { value: "Shortlist all candidates with React and teamwork above 8" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send command" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    });
  });

  it("uses Groq planner response when available", async () => {
    mocks.plannerPost.mockResolvedValue({
      data: {
        result: {
          type: "navigate",
          routeKey: "dashboard",
          params: {},
        },
      },
    });

    render(
      <AppOperatorProvider>
        <AppOperatorPanel />
      </AppOperatorProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /ai operator/i }));
    fireEvent.change(screen.getByPlaceholderText("Type a command..."), {
      target: { value: "go home" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send command" }));

    await waitFor(() => {
      expect(screen.getByText("Planned with Groq AI.")).toBeInTheDocument();
      expect(mocks.push).toHaveBeenCalledWith("/app");
    });
  });
});
