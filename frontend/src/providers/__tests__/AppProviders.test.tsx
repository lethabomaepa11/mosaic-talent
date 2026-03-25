import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/providers";

describe("AppProviders", () => {
  it("renders children through provider tree", () => {
    render(
      <AppProviders>
        <div>provider-child</div>
      </AppProviders>,
    );

    expect(screen.getByText("provider-child")).toBeInTheDocument();
  });
});
