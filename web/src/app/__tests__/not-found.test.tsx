import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { HTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotFound from "../not-found";

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const MotionStub = ({
    children,
    ...props
  }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) =>
    React.createElement("div", props, children);

  return {
    motion: new Proxy(
      {},
      {
        get: () => MotionStub,
      },
    ),
  };
});

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    back: mocks.back,
  }),
}));

describe("NotFound page", () => {
  beforeEach(() => {
    cleanup();
    mocks.push.mockReset();
    mocks.back.mockReset();
  });

  it("renders the lost-page message and actions", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { name: /oops, looks like you are lost/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Take Me Home" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go Back" })).toBeInTheDocument();
  });

  it("navigates home when Take Me Home is clicked", () => {
    render(<NotFound />);

    fireEvent.click(screen.getByRole("button", { name: "Take Me Home" }));

    expect(mocks.push).toHaveBeenCalledWith("/");
  });

  it("navigates back when Go Back is clicked", () => {
    render(<NotFound />);

    fireEvent.click(screen.getByRole("button", { name: "Go Back" }));

    expect(mocks.back).toHaveBeenCalledTimes(1);
  });
});
