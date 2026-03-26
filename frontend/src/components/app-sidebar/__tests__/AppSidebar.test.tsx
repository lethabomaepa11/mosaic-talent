import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
  it("renders developer navigation by default", () => {
    mocks.usePathname.mockReturnValue("/app/projects/open");

    render(<AppSidebar />);

    expect(screen.getByText("Discover")).toBeInTheDocument();
    expect(screen.getByText("My Projects")).toBeInTheDocument();
    expect(screen.getByText("My Profile")).toBeInTheDocument();
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

  it("calls logout and redirects when sign out is clicked", async () => {
    mocks.usePathname.mockReturnValue("/app/projects/open");
    mocks.logout.mockResolvedValue(undefined);

    render(<AppSidebar />);

    fireEvent.click(screen.getAllByRole("button", { name: "Sign Out" })[0]);
    await waitFor(() => {
      expect(mocks.logout).toHaveBeenCalledTimes(1);
      expect(mocks.replace).toHaveBeenCalledWith("/login");
    });
  });
});
