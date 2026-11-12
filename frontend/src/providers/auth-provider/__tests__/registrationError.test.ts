import { describe, expect, it } from "vitest";
import { registrationErrorMessage } from "../registrationError";

describe("registration error messages", () => {
  it("surfaces and deduplicates backend validation messages", () => {
    expect(registrationErrorMessage({ isAxiosError: true, response: { data: { error: {
      message: "Your request is not valid!", validationErrors: [
        { message: "Password must have at most 32 characters." },
        { message: "Password must have at most 32 characters." }, { message: null },
      ],
    } } } })).toBe("Password must have at most 32 characters.");
  });
  it("uses a backend message when no useful field errors exist", () => {
    expect(registrationErrorMessage({ isAxiosError: true, response: { data: { error: {
      message: "This email is already registered.", validationErrors: [{ message: " " }],
    } } } })).toBe("This email is already registered.");
  });
  it("handles unavailable or malformed backend responses", () => {
    expect(registrationErrorMessage({ isAxiosError: true })).toContain("Unable to create");
    expect(registrationErrorMessage({ isAxiosError: true, response: { data: { error: { message: 42, validationErrors: "invalid" } } } })).toContain("Unable to create");
  });
  it("preserves ordinary errors and handles unknown failures", () => {
    expect(registrationErrorMessage(new Error("Account cannot sign in yet"))).toBe("Account cannot sign in yet");
    expect(registrationErrorMessage(null)).toContain("Unable to create");
  });
});
