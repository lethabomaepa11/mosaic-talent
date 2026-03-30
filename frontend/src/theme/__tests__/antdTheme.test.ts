import { describe, expect, it } from "vitest";
import { antdTheme, designTokens, getAntdTheme } from "@/theme/antdTheme";

describe("antdTheme", () => {
  it("maps core brand tokens", () => {
    expect(antdTheme.token?.colorPrimary).toBe(designTokens.gold);
    expect(antdTheme.token?.colorBgBase).toBe(designTokens.ink);
    expect(antdTheme.token?.colorTextBase).toBe(designTokens.paper);
    expect(antdTheme.token?.borderRadius).toBe(12);
    expect(antdTheme.token?.colorWarningBg).toBe(designTokens.warningBg);
    expect(antdTheme.token?.colorWarningBorder).toBe(designTokens.warningBorder);
    expect(antdTheme.token?.colorWarningText).toBe(designTokens.warningText);
    expect(antdTheme.token?.colorSuccessBg).toBe(designTokens.successBg);
    expect(antdTheme.token?.colorErrorBg).toBe(designTokens.errorBg);
  });

  it("returns distinct palette values for light mode", () => {
    const lightTheme = getAntdTheme("light");

    expect(lightTheme.token?.colorPrimary).toBe(designTokens.gold);
    expect(lightTheme.token?.colorBgBase).not.toBe(designTokens.ink);
    expect(lightTheme.token?.colorTextBase).not.toBe(designTokens.paper);
  });
});
