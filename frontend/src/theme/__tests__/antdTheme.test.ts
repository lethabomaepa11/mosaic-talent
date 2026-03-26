import { describe, expect, it } from "vitest";
import { antdTheme, designTokens } from "@/theme/antdTheme";

describe("antdTheme", () => {
  it("maps core brand tokens", () => {
    expect(antdTheme.token?.colorPrimary).toBe(designTokens.gold);
    expect(antdTheme.token?.colorBgBase).toBe(designTokens.ink);
    expect(antdTheme.token?.colorTextBase).toBe(designTokens.paper);
    expect(antdTheme.token?.borderRadius).toBe(12);
  });
});
