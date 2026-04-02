import { describe, expect, it } from "vitest";
import {
  normalizeSuggestionValues,
  toSuggestionOptions,
} from "../aiSuggestions";

describe("profile aiSuggestions helpers", () => {
  it("normalizes, filters, de-duplicates, and applies query", () => {
    const suggestions = normalizeSuggestionValues(
      ["  React ", "React", "API Design", "api design", "GraphQL"],
      ["react"],
      "api",
      8,
    );

    expect(suggestions).toEqual(["API Design"]);
  });

  it("respects limit", () => {
    const suggestions = normalizeSuggestionValues(
      ["A", "B", "C", "D"],
      [],
      "",
      2,
    );

    expect(suggestions).toEqual(["A", "B"]);
  });

  it("maps options for autocomplete", () => {
    expect(toSuggestionOptions(["TypeScript", "React"])).toEqual([
      { value: "TypeScript", label: "TypeScript" },
      { value: "React", label: "React" },
    ]);
  });
});
