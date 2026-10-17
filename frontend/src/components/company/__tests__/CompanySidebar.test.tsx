import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CompanySidebar } from "../sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/jobs",
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuthAction: () => ({ logout: vi.fn() }),
}));

vi.mock("@/providers/appearance-provider", () => ({
  useAppearanceState: () => ({ mode: "light" }),
}));

vi.mock("@/providers/tenant-provider", () => ({
  useTenantResolutionState: () => ({ companyLogoUrl: "", companyName: "", tenancyName: "" }),
}));

describe("CompanySidebar", () => {
  it("keeps company routes accessible in icon-only mode", () => {
    const onCollapseToggle = vi.fn();
    render(<CompanySidebar collapsed onCollapseToggle={onCollapseToggle} />);

    expect(screen.queryByText("Job Postings")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Job Postings" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(onCollapseToggle).toHaveBeenCalledOnce();
  });
});
