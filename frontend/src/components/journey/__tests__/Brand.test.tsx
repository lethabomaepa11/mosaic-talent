import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppearanceStateContext, INITIAL_STATE } from "@/providers/appearance-provider/context";
import { Brand } from "../Brand";

afterEach(cleanup);

describe("original mosaic.talent branding", () => {
  it.each([ ["light", "/text-logo-light.svg"], ["dark", "/text-logo.svg"] ] as const)("uses the original wordmark in %s mode", (mode, source) => {
    render(<AppearanceStateContext.Provider value={{ ...INITIAL_STATE, mode }}><Brand/></AppearanceStateContext.Provider>);
    expect(screen.getByRole("link", { name: "mosaic.talent home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("img", { name: "mosaic.talent" })).toHaveAttribute("src", source);
  });

  it("uses the original emblem in collapsed navigation", () => {
    render(<Brand compact/>);
    const logo = screen.getByRole("img", { name: "mosaic.talent" });
    expect(logo).toHaveAttribute("src", "/logo.svg");
    expect(logo).toHaveAttribute("width", "32");
  });
});
