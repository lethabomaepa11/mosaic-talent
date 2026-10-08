import { IJobAssessmentProblem } from "@/providers/job-provider";
import { SubmissionDraft, TaskWorkspace } from "./types";

const joinWorkspaceFiles = (files: Record<string, string>): string => {
  const entries = Object.entries(files).sort((a, b) => a[0].localeCompare(b[0]));
  return entries
    .map(([path, content]) => `// FILE: ${path}\n${content ?? ""}`)
    .join("\n\n");
};

const getNonEmptyFiles = (workspace: TaskWorkspace): Record<string, string> => {
  const files = workspace.files ?? {};
  return Object.fromEntries(
    Object.entries(files).filter(
      ([path, content]) =>
        path.trim().length > 0 && (content ?? "").trim().length > 0,
    ),
  );
};

const trimForSubmission = (value: string, max: number): string => {
  if (!value) return "";
  const normalized = value.trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max)}...`;
};

export const hasAnyWorkspaceCode = (
  workspaceByProblem: Record<string, TaskWorkspace>,
): boolean =>
  Object.values(workspaceByProblem).some((workspace) =>
    Object.values(workspace.files ?? {}).some(
      (content) => (content ?? "").trim().length >= 20,
    ),
  );

export const buildProblemsPayload = (
  problems: IJobAssessmentProblem[],
  draft: SubmissionDraft,
) =>
  (problems ?? []).map((problem) => {
    const workspace =
      draft.workspaceByProblem[problem.id] ??
      ({
        files: {},
        activeFilePath: "",
        folders: [],
        fileOrder: [],
        promptAttempts: [],
        proposals: [],
        terminalLogs: [],
        apiPlayground: {
          method: "POST",
          path: "/api/auth/login",
          body: "",
          response: "",
        },
      } as TaskWorkspace);
    const files = getNonEmptyFiles(workspace);

    return {
      problemId: problem.id,
      title: problem.title,
      description: problem.description,
      language: problem.language,
      code: joinWorkspaceFiles(files),
      files,
      fileOrder: (workspace.fileOrder ?? []).filter((path) => path in files),
      activeFilePath: workspace.activeFilePath || "",
      passedPublic: 0,
      totalPublic: 0,
      promptAttempts: (workspace.promptAttempts ?? []).slice(-12).map((item) => ({
        ...item,
        prompt: trimForSubmission(item.prompt, 1200),
        response: trimForSubmission(item.response, 1600),
      })),
    };
  });

export const buildAssessmentSubmissionText = (input: {
  problems: IJobAssessmentProblem[];
  draft: SubmissionDraft;
  selectedProblemId: string;
  telemetry: {
    promptCount: number;
    proposalCount: number;
    acceptedCount: number;
    declinedCount: number;
    acceptedHallucinations: number;
    acceptanceRatio: number;
  };
}): string => {
  const payload: Record<string, unknown> = {
    format: "leetprompt-v2",
    mode: input.draft.mode,
    selectedProblemId: input.selectedProblemId,
    problems: buildProblemsPayload(input.problems, input.draft),
    questionnaireAnswers: input.draft.questionnaireAnswers,
    telemetry: input.telemetry,
    submittedAt: new Date().toISOString(),
  };

  const collaborationResponse = (input.draft.collaborationResponse ?? "").trim();
  if (collaborationResponse.length > 0) {
    payload.collaborationResponse = collaborationResponse;
  }

  return JSON.stringify(payload);
};
