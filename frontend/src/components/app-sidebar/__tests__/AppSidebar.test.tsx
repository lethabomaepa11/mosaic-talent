import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/components/app-sidebar";

const mocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
  replace: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
  useRouter: () => ({
    replace: mocks.replace,
  }),
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuthAction: () => ({
    logout: mocks.logout,
  }),
}));

describe("AppSidebar", () => {
  beforeEach(() => {
    cleanup();
    mocks.usePathname.mockReset();
    mocks.replace.mockReset();
    mocks.logout.mockReset();
  });

  it("renders developer navigation by default", () => {
    mocks.usePathname.mockReturnValue("/app/projects/open");

    render(<AppSidebar />);

    expect(screen.getByText("Discover")).toBeInTheDocument();
    expect(screen.queryByText("My Projects")).not.toBeInTheDocument();
    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(screen.getByText("How to use")).toBeInTheDocument();
    expect(screen.getAllByText("+ Create Project").length).toBeGreaterThan(0);
    expect(screen.queryByText("AI Simulator")).not.toBeInTheDocument();
    expect(screen.queryByText("+ Start Simulation")).not.toBeInTheDocument();
  });

  it("keeps developer navigation regardless of non-developer path", () => {
    mocks.usePathname.mockReturnValue("/company/jobs");

    render(<AppSidebar />);

    expect(screen.queryByText("Job Postings")).not.toBeInTheDocument();
    expect(screen.queryByText("Candidates")).not.toBeInTheDocument();
    expect(screen.queryByText("Reports")).not.toBeInTheDocument();
    expect(screen.getAllByText("+ Create Project").length).toBeGreaterThan(0);
  });

  it("shows icon-only navigation and an accessible expand control when collapsed", () => {
    mocks.usePathname.mockReturnValue("/app/projects/open");
    const onCollapseToggle = vi.fn();

    render(<AppSidebar collapsed onCollapseToggle={onCollapseToggle} />);

    expect(screen.queryByText("Discover")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Discover" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Create Project" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(onCollapseToggle).toHaveBeenCalledOnce();
  });

  it("calls logout and redirects when sign out is clicked", async () => {
    mocks.usePathname.mockReturnValue("/app/projects/open");
    mocks.logout.mockResolvedValue(undefined);

    render(<AppSidebar />);

    fireEvent.click(screen.getAllByRole("button", { name: "Sign Out" })[0]);
    await waitFor(() => {
      expect(mocks.logout).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/login");
    });
  });
});
