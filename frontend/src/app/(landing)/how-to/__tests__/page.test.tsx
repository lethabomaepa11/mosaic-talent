import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PublicHowToPage from "../page";

describe("PublicHowToPage", () => {
  it("explains the journey before sign-in and directs people to signup", () => {
    render(<PublicHowToPage />);
    expect(screen.getByRole("heading", { name: /make an idea real/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create an account/i })).toHaveAttribute("href", "/signup");
  });
});
