import { describe, expect, it } from "vitest";
import {
  buildFullDraftPrompt,
  buildMarkdownFromTitlePrompt,
  buildMarkdownPolishPrompt,
  buildSkillsFromContextPrompt,
  buildSkillsPolishPrompt,
  normalizeSkills,
  skillsToFieldValue,
} from "../aiPromptHelpers";

describe("aiPromptHelpers", () => {
  it("normalizes and deduplicates skills", () => {
    const result = normalizeSkills("React, TypeScript, react, , Node.js");
    expect(result).toEqual(["React", "TypeScript", "Node.js"]);
  });

  it("serializes skill list for form field", () => {
    const result = skillsToFieldValue(["React", "react", "Node.js"]);
    expect(result).toBe("React, Node.js");
  });

  it("builds markdown-from-title prompt with context", () => {
    const result = buildMarkdownFromTitlePrompt("Focus on security", "Repo Guard");
    expect(result).toContain("Repo Guard");
    expect(result).toContain("Focus on security");
  });

  it("builds markdown polish prompt with existing markdown", () => {
    const result = buildMarkdownPolishPrompt(
      "",
      "Repo Guard",
      "# draft",
    );
    expect(result).toContain("Current markdown: # draft");
  });

  it("builds skills prompts from markdown context", () => {
    const generated = buildSkillsFromContextPrompt("", "Repo Guard", "spec");
    const polished = buildSkillsPolishPrompt("", "Repo Guard", "spec", "React, Node");
    expect(generated).toContain("Project markdown context: spec");
    expect(polished).toContain("Current skills: React, Node");
  });

  it("builds full draft prompt with optional fields", () => {
    const result = buildFullDraftPrompt("keep it concise", "Repo Guard", "", "");
    expect(result).toContain("Use this project title as anchor: Repo Guard");
    expect(result).toContain("keep it concise");
  });
});
