import { describe, expect, it } from "vitest";
import {
  buildAssessmentSubmissionText,
  buildProblemsPayload,
  hasAnyWorkspaceCode,
} from "../submission";
import { SubmissionDraft } from "../types";

const createDraft = (): SubmissionDraft => ({
  mode: "fullstack",
  selectedProblemId: "p1",
  mainFlowCode: "",
  workspaceByProblem: {
    p1: {
      files: {
        "src/main.ts": "export const solve = () => 42;",
        "src/notes.md": "",
      },
      activeFilePath: "src/main.ts",
      folders: ["src"],
      fileOrder: ["src/main.ts", "src/notes.md"],
      promptAttempts: [],
      proposals: [],
      terminalLogs: [],
      apiPlayground: {
        method: "POST",
        path: "/api/auth/login",
        body: "{}",
        response: "",
      },
    },
  },
  collaborationResponse: "",
  promptAttempts: [],
  proposals: [],
  questionnaireAnswers: {
    "Why this design?": "It keeps separation of concerns clear.",
  },
  apiPlayground: {
    method: "POST",
    path: "/api/auth/login",
    body: "{}",
    response: "",
  },
});

describe("assessment submission helper", () => {
  it("detects when workspace has submittable code", () => {
    const draft = createDraft();
    expect(hasAnyWorkspaceCode(draft.workspaceByProblem)).toBe(true);
  });

  it("returns false when all workspace files are too short", () => {
    const draft = createDraft();
    draft.workspaceByProblem.p1.files["src/main.ts"] = "short";
    expect(hasAnyWorkspaceCode(draft.workspaceByProblem)).toBe(false);
  });

  it("builds per-problem payload with task metadata and non-empty files", () => {
    const draft = createDraft();
    const payload = buildProblemsPayload(
      [
        {
          id: "p1",
          title: "Build auth endpoint",
          description: "Implement login flow",
          language: "typescript",
          starterCode: "",
          maxScore: 100,
          order: 1,
          publicTests: [],
        },
      ],
      draft,
    );

    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({
      problemId: "p1",
      title: "Build auth endpoint",
      description: "Implement login flow",
      language: "typescript",
      activeFilePath: "src/main.ts",
    });
    expect(payload[0].files).toEqual({
      "src/main.ts": "export const solve = () => 42;",
    });
    expect(payload[0].code).toContain("// FILE: src/main.ts");
    expect(payload[0].code).not.toContain("src/notes.md");
  });

  it("builds compact submission json with problems and no workspace tree duplication", () => {
    const draft = createDraft();
    const submissionText = buildAssessmentSubmissionText({
      problems: [
        {
          id: "p1",
          title: "Build auth endpoint",
          description: "Implement login flow",
          language: "typescript",
          starterCode: "",
          maxScore: 100,
          order: 1,
          publicTests: [],
        },
      ],
      draft,
      selectedProblemId: "p1",
      telemetry: {
        promptCount: 0,
        proposalCount: 0,
        acceptedCount: 0,
        declinedCount: 0,
        acceptedHallucinations: 0,
        acceptanceRatio: 0,
      },
    });

    const parsed = JSON.parse(submissionText) as Record<string, unknown>;
    expect(parsed.format).toBe("leetprompt-v2");
    expect(Array.isArray(parsed.problems)).toBe(true);
    expect(parsed.workspaceByProblem).toBeUndefined();
    expect(parsed.collaborationResponse).toBeUndefined();
  });
});

