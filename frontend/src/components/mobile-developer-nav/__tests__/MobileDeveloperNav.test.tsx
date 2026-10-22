import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileDeveloperNav } from "../MobileDeveloperNav";

vi.mock("next/navigation", () => ({ usePathname: () => "/app/ideator" }));

describe("MobileDeveloperNav", () => {
  it("keeps core destinations in the bottom nav and puts less-used routes in More", () => {
    render(<MobileDeveloperNav />);
    expect(screen.getByRole("link", { name: /discover/i, hidden: true })).toHaveAttribute("href", "/app/projects/open");
    expect(screen.getByRole("link", { name: /reviews/i, hidden: true })).toHaveAttribute("href", "/app/reviews");
    expect(screen.getByRole("link", { name: /profile/i, hidden: true })).toHaveAttribute("href", "/app/profile");
    expect(screen.queryByRole("link", { name: /projects/i, hidden: true })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /open more navigation/i, hidden: true }));
    expect(screen.getByRole("link", { name: /projects/i })).toHaveAttribute("href", "/app/projects/my");
    expect(screen.getByRole("link", { name: /ideator/i })).toHaveAttribute("href", "/app/ideator");
    expect(screen.getByRole("link", { name: /settings/i })).toHaveAttribute("href", "/app/preferences");
  });
});

