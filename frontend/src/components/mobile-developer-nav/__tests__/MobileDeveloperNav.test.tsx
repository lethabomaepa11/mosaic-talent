import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileDeveloperNav } from "../MobileDeveloperNav";

const mocks = vi.hoisted(() => ({ usePathname: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: mocks.usePathname }));

describe("MobileDeveloperNav", () => {
  beforeEach(() => mocks.usePathname.mockReturnValue("/app/projects/open"));

  it("keeps the three primary destinations visible and moves infrequent links to More", () => {
    render(<MobileDeveloperNav />);
    expect(screen.getByRole("navigation", { name: "Developer mobile navigation", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /discover/i, hidden: true })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /reviews/i, hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /profile/i, hidden: true })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /projects/i, hidden: true })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open more navigation", hidden: true }));
    expect(screen.getByRole("navigation", { name: "More developer navigation", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /projects/i, hidden: true })).toHaveAttribute("href", "/app/projects/my");
    expect(screen.getByRole("link", { name: /how to use/i, hidden: true })).toHaveAttribute("href", "/app/how-to");
    expect(screen.getByRole("link", { name: /settings/i, hidden: true })).toHaveAttribute("href", "/app/preferences");
  });
});
