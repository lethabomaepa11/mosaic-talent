export type AssessmentMode = "frontend" | "backend" | "fullstack";

export type ProposalStatus = "pending" | "accepted" | "declined";

export interface Proposal {
  id: string;
  title: string;
  description: string;
  patch: string;
  targetPath?: string;
  createPath?: boolean;
  isHallucination: boolean;
  status: ProposalStatus;
  sourcePrompt: string;
}

export interface PromptAttempt {
  prompt: string;
  response: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  accepted: boolean;
}

export interface ApiPlaygroundState {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body: string;
  response: string;
}

export interface SubmissionDraft {
  mode: AssessmentMode;
  selectedProblemId: string;
  mainFlowCode: string;
  workspaceByProblem: Record<string, TaskWorkspace>;
  collaborationResponse: string;
  promptAttempts: PromptAttempt[];
  proposals: Proposal[];
  questionnaireAnswers: Record<string, string>;
  apiPlayground: ApiPlaygroundState;
}

export interface TaskWorkspace {
  files: Record<string, string>;
  activeFilePath: string;
  folders: string[];
  fileOrder: string[];
  promptAttempts: PromptAttempt[];
  proposals: Proposal[];
  terminalLogs: string[];
  apiPlayground: ApiPlaygroundState;
}

export const EMPTY_DRAFT: SubmissionDraft = {
  mode: "frontend",
  selectedProblemId: "",
  mainFlowCode: "",
  workspaceByProblem: {},
  collaborationResponse: "",
  promptAttempts: [],
  proposals: [],
  questionnaireAnswers: {},
  apiPlayground: {
    method: "POST",
    path: "/api/auth/login",
    body: JSON.stringify({ email: "user@example.com", password: "******" }, null, 2),
    response: "",
  },
};
