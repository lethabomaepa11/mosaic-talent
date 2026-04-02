import { describe, expect, it } from "vitest";
import {
  getDefaultEmailTemplateSettings,
  parseEmailTemplateSettings,
} from "../emailTemplateSettings";

describe("emailTemplateSettings", () => {
  it("returns defaults when json is missing", () => {
    const parsed = parseEmailTemplateSettings();
    const defaults = getDefaultEmailTemplateSettings();

    expect(parsed).toEqual(defaults);
  });

  it("returns defaults when json is invalid", () => {
    const parsed = parseEmailTemplateSettings("{invalid}");
    const defaults = getDefaultEmailTemplateSettings();

    expect(parsed).toEqual(defaults);
  });

  it("parses all supported template types", () => {
    const parsed = parseEmailTemplateSettings(
      JSON.stringify({
        applicationReceived: {
          enabled: false,
          mode: "ai",
          subject: "Received",
          body: "Body A",
        },
        shortlisted: {
          enabled: true,
          mode: "manual",
          subject: "Shortlisted",
          body: "Body B",
        },
        interviewInvite: {
          enabled: true,
          mode: "ai",
          subject: "Interview",
          body: "Body C",
        },
      }),
    );

    expect(parsed.applicationReceived.subject).toBe("Received");
    expect(parsed.shortlisted.subject).toBe("Shortlisted");
    expect(parsed.interviewInvite.subject).toBe("Interview");
    expect(parsed.applicationReceived.mode).toBe("ai");
    expect(parsed.interviewInvite.mode).toBe("ai");
  });
});
