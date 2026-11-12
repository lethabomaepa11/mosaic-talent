import { describe, expect, it } from "vitest";
import { isStrongPassword } from "../validation";

describe("signup password validation", () => {
  it.each(["short", "lowercase123!", "UPPERCASE123!", "NoNumber!", "NoSymbol123", "Has Space1!"])("rejects %s", (password) => {
    expect(isStrongPassword(password)).toBe(false);
  });
  it("accepts a strong password", () => expect(isStrongPassword("Strong1!pass")).toBe(true));
  it("accepts the API maximum of 32 characters", () => expect(isStrongPassword("Strong1!" + "x".repeat(24))).toBe(true));
  it("rejects passwords above the API maximum", () => expect(isStrongPassword("Strong1!" + "x".repeat(25))).toBe(false));
});
