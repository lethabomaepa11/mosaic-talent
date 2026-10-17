import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

vi.mock("@/providers/tenant-provider", () => ({
  useTenantResolutionState: () => ({
    tenancyName: "acme",
  }),
}));

describe("AppOperatorPanel", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.plannerPost.mockReset();
    mocks.plannerPost.mockRejectedValue(new Error("Planner unavailable"));
  });

  afterEach(() => {
    cleanup();
  });

  it("prompts for missing fields when required fields are absent", async () => {
    render(
      <AppOperatorProvider>
        <AppOperatorPanel />
      </AppOperatorProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /ask moahi/i }));
    fireEvent.change(screen.getByPlaceholderText("Ask a question or type /help"), {
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

    fireEvent.click(screen.getByRole("button", { name: /ask moahi/i }));
    fireEvent.change(screen.getByPlaceholderText("Ask a question or type /help"), {
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
          mode: "execute",
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

    fireEvent.click(screen.getByRole("button", { name: /ask moahi/i }));
    fireEvent.change(screen.getByPlaceholderText("Ask a question or type /help"), {
      target: { value: "go home" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send command" }));

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith("/app");
    });
  });

  it("shows chat guidance and run-now offer for guided responses", async () => {
    mocks.plannerPost.mockResolvedValue({
      data: {
        result: {
          mode: "guided",
          type: "create_job",
          assistantReply: "You can do this in three steps.",
          shouldOfferExecution: true,
          steps: ["Open Jobs", "Click Create Job", "Submit role details"],
          params: {
            title: "Frontend Engineer",
            location: "Remote",
            description: "Role summary",
          },
        },
      },
    });

    render(
      <AppOperatorProvider>
        <AppOperatorPanel />
      </AppOperatorProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /ask moahi/i }));
    fireEvent.change(screen.getByPlaceholderText("Ask a question or type /help"), {
      target: { value: "How do I create a frontend role?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send command" }));

    await waitFor(() => {
      expect(screen.getByText(/three steps/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /run it now/i })).toBeInTheDocument();
      expect(screen.getByText("Open Jobs")).toBeInTheDocument();
    });
  });

  it("answers slash help without calling the remote planner", async () => {
    render(
      <AppOperatorProvider>
        <AppOperatorPanel />
      </AppOperatorProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /ask moahi/i }));
    fireEvent.change(screen.getByPlaceholderText("Ask a question or type /help"), {
      target: { value: "/help" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send command" }));

    await waitFor(() => {
      expect(screen.getByText(/I can explain the next step/i)).toBeInTheDocument();
    });
    expect(mocks.plannerPost).not.toHaveBeenCalled();
  });
});
