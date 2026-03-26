import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/components/app-sidebar";

const mocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuthAction: () => ({
    logout: mocks.logout,
  }),
}));

describe("AppSidebar", () => {
  it("renders developer navigation by default", () => {
    mocks.usePathname.mockReturnValue("/app/projects");

    render(<AppSidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getAllByText("+ Create Project").length).toBeGreaterThan(0);
  });

  it("keeps developer navigation regardless of non-developer path", () => {
    mocks.usePathname.mockReturnValue("/company/jobs");

    render(<AppSidebar />);

    expect(screen.queryByText("Job Postings")).not.toBeInTheDocument();
    expect(screen.queryByText("Candidates")).not.toBeInTheDocument();
    expect(screen.queryByText("Reports")).not.toBeInTheDocument();
    expect(screen.getAllByText("+ Create Project").length).toBeGreaterThan(0);
  });

  it("calls logout when sign out is clicked", () => {
    mocks.usePathname.mockReturnValue("/app");
    mocks.logout.mockResolvedValue(undefined);

    render(<AppSidebar />);

    fireEvent.click(screen.getAllByRole("button", { name: "Sign Out" })[0]);
    expect(mocks.logout).toHaveBeenCalledTimes(1);
  });
});
