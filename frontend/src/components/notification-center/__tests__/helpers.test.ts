import { describe, expect, it } from "vitest";
import { formatDate, getNotificationUrl, getPushButton, severityColor, toErrorMessage } from "../helpers";

describe("notification presentation helpers", () => {
  it("handles invalid dates and preserves useful errors", () => {
    expect(formatDate("not-a-date")).toBe("Unknown date");
    expect(formatDate("2026-11-07T12:00:00Z")).not.toBe("Unknown date");
    expect(toErrorMessage(new Error("Permission denied"), "Try again")).toBe("Permission denied");
    expect(toErrorMessage(undefined, "Try again")).toBe("Try again");
  });
  it.each([["success", "green"], [" WARN ", "gold"], ["warning", "gold"], ["error", "red"], ["information", "blue"]])("handles severity %s", (input, color) => {
    expect(severityColor(input)).toBe(color);
  });
  it("reads current and legacy notification links and tolerates malformed payloads", () => {
    for (const payload of [JSON.stringify({ url: " /app/work " }), JSON.stringify({ Url: "/app/work" }), JSON.stringify({ properties: { Url: "/app/work" } })]) expect(getNotificationUrl(payload)).toBe("/app/work");
    for (const payload of [undefined, "", " ", "bad-json", "null", JSON.stringify({ properties: 2 }), JSON.stringify({ url: 42 })]) expect(getNotificationUrl(payload)).toBe("");
  });
  it.each([
    [false, false, false, "Push unsupported", true],
    [true, false, false, "Push unavailable", true],
    [true, true, true, "Disable push", false],
    [true, true, false, "Enable push", false],
  ] as const)("keeps the push action accurate for support/configuration/subscription %s/%s/%s", (pushSupported, isPushConfigured, isPushSubscribed, label, disabled) => {
    expect(getPushButton({ pushSupported, isPushConfigured, isPushSubscribed })).toMatchObject({ label, disabled });
  });
});
