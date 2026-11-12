import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HowToPage from "../page";

describe("HowToPage", () => {
  it("shows a practical developer walkthrough with direct next actions", () => {
    render(<HowToPage />);

    expect(screen.getByRole("heading", { name: "Getting started" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find a project" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /discover projects/i })).toHaveAttribute("href", "/app/projects/open");
    expect(screen.getByRole("link", { name: /open my profile/i })).toHaveAttribute("href", "/app/build-profile");
  });
});
