import { beforeEach, describe, expect, it } from "vitest";
import { clearDraft, readDraft, storeDraft } from "../draftStorage";

describe("onboarding form cache", () => {
  beforeEach(() => sessionStorage.clear());
  it("preserves form values across reads without exposing another account's draft", () => {
    storeDraft(99, ["Python"], ["Lead a team"]);
    expect(readDraft(99)).toEqual({ skills: ["Python"], goals: ["Lead a team"] });
    expect(readDraft(100)).toEqual({ skills: undefined, goals: undefined });
    clearDraft(99);
    expect(readDraft(99).skills).toBeUndefined();
  });
  it("ignores malformed cache contents", () => {
    sessionStorage.setItem("mosaic-talent.onboarding-form.99", "invalid json");
    expect(readDraft(99)).toEqual({});
  });
});
