import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearFormDraft, readFormDraft, writeFormDraft } from "../formDraft";

beforeEach(() => { sessionStorage.clear(); vi.restoreAllMocks(); });
describe("form recovery", () => {
  it("keeps drafts separate by account and project and clears successful drafts", () => {
    writeFormDraft("12.project-a", {title:"Unfinished work"});
    expect(readFormDraft("12.project-a")).toEqual({title:"Unfinished work"});
    expect(readFormDraft("13.project-a")).toEqual({});
    expect(readFormDraft("12.project-b")).toEqual({});
    clearFormDraft("12.project-a"); expect(readFormDraft("12.project-a")).toEqual({});
  });
  it.each(["invalid", "null", "[]", '"text"'])("ignores malformed caches: %s", value => {
    sessionStorage.setItem("mosaic.talent.form.12", value); expect(readFormDraft("12")).toEqual({});
  });
  it("keeps form submission possible when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(() => writeFormDraft("12", {title:"Work"})).not.toThrow();
  });
});
