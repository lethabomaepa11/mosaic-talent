import { EMPTY_DRAFT, Proposal, PromptAttempt, SubmissionDraft } from "./types";

const nowId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const parseDraft = (submissionText?: string): SubmissionDraft => {
  if (!submissionText) return { ...EMPTY_DRAFT };
  try {
    const parsed = JSON.parse(submissionText) as Partial<SubmissionDraft>;
    return {
      ...EMPTY_DRAFT,
      ...parsed,
      mode:
        parsed.mode === "frontend" || parsed.mode === "backend" || parsed.mode === "fullstack"
          ? parsed.mode
          : EMPTY_DRAFT.mode,
      selectedProblemId: typeof parsed.selectedProblemId === "string" ? parsed.selectedProblemId : EMPTY_DRAFT.selectedProblemId,
      workspaceByProblem:
        parsed.workspaceByProblem && typeof parsed.workspaceByProblem === "object"
          ? (parsed.workspaceByProblem as SubmissionDraft["workspaceByProblem"])
          : {},
      apiPlayground: { ...EMPTY_DRAFT.apiPlayground, ...(parsed.apiPlayground ?? {}) },
      promptAttempts: Array.isArray(parsed.promptAttempts) ? (parsed.promptAttempts as PromptAttempt[]) : [],
      proposals: Array.isArray(parsed.proposals) ? (parsed.proposals as Proposal[]) : [],
      questionnaireAnswers:
        parsed.questionnaireAnswers && typeof parsed.questionnaireAnswers === "object"
          ? (parsed.questionnaireAnswers as Record<string, string>)
          : {},
    };
  } catch {
    return { ...EMPTY_DRAFT };
  }
};

const safeTrim = (text: string, fallback: string) => {
  const value = text?.trim() ?? "";
  return value.length > 0 ? value : fallback;
};

const hallucinatedPatch = () =>
  `// Extra feature proposal (potentially off-scope)\n` +
  `// Added social login buttons and analytics tracking.\n` +
  `const socialProviders = ["Google", "GitHub"];`;

const parseJsonPayload = (raw: string): unknown | null => {
  if (!raw || !raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const normalizeCodeText = (value: string): string => {
  if (!value) return "";
  const trimmed = value.trim();
  const unescaped = trimmed
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
  return unescaped;
};

const extractDescriptionFromObject = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;

  const directDescription =
    typeof record.description === "string"
      ? record.description
      : typeof record.message === "string"
        ? record.message
        : null;
  if (directDescription && directDescription.trim()) return directDescription.trim();

  const response = record.response;
  if (response && typeof response === "object") {
    const responseRecord = response as Record<string, unknown>;
    if (typeof responseRecord.description === "string" && responseRecord.description.trim()) {
      return responseRecord.description.trim();
    }
    for (const value of Object.values(responseRecord)) {
      if (value && typeof value === "object") {
        const nested = value as Record<string, unknown>;
        if (typeof nested.description === "string" && nested.description.trim()) {
          return nested.description.trim();
        }
      }
    }
  }

  return null;
};

const extractCodeFromObject = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;

  const directCode =
    typeof record.code === "string"
      ? record.code
      : typeof record.content === "string"
        ? record.content
        : null;
  if (directCode && directCode.trim()) return normalizeCodeText(directCode);

  const response = record.response;
  if (response && typeof response === "object") {
    const responseRecord = response as Record<string, unknown>;
    if (typeof responseRecord.code === "string" && responseRecord.code.trim()) return normalizeCodeText(responseRecord.code);
    if (typeof responseRecord.content === "string" && responseRecord.content.trim()) return normalizeCodeText(responseRecord.content);
    for (const value of Object.values(responseRecord)) {
      if (value && typeof value === "object") {
        const nested = value as Record<string, unknown>;
        if (typeof nested.code === "string" && nested.code.trim()) {
          return normalizeCodeText(nested.code);
        }
        if (typeof nested.content === "string" && nested.content.trim()) {
          return normalizeCodeText(nested.content);
        }
        const nestedResponse = nested.response;
        if (nestedResponse && typeof nestedResponse === "object") {
          const nestedResponseRecord = nestedResponse as Record<string, unknown>;
          if (typeof nestedResponseRecord.code === "string" && nestedResponseRecord.code.trim()) {
            return normalizeCodeText(nestedResponseRecord.code);
          }
          if (typeof nestedResponseRecord.content === "string" && nestedResponseRecord.content.trim()) {
            return normalizeCodeText(nestedResponseRecord.content);
          }
        }
      }
    }
  }

  return null;
};

const extractFilesFromObject = (payload: unknown): Array<{ path: string; content: string }> => {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  const candidates: unknown[] = [];
  if (Array.isArray(record.files)) candidates.push(record.files);
  if (record.response && typeof record.response === "object") {
    const responseRecord = record.response as Record<string, unknown>;
    if (Array.isArray(responseRecord.files)) candidates.push(responseRecord.files);
    Object.values(responseRecord).forEach((value) => {
      if (value && typeof value === "object") {
        const nested = value as Record<string, unknown>;
        if (Array.isArray(nested.files)) candidates.push(nested.files);
      }
    });
  }

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const output: Array<{ path: string; content: string }> = [];
    candidate.forEach((node) => {
      if (!node || typeof node !== "object") return;
      const item = node as Record<string, unknown>;
      const path = typeof item.path === "string" ? item.path.trim() : "";
      const content = typeof item.content === "string" ? normalizeCodeText(item.content) : "";
      if (!path || !content) return;
      output.push({ path, content });
    });
    if (output.length > 0) return output;
  }

  return [];
};

export const parseStructuredAiEnvelope = (
  prompt: string,
  aiResponse: string,
  attemptIndex: number,
  targetPath?: string,
): { displayText: string; proposals: Proposal[] } => {
  const payload = parseJsonPayload(aiResponse);
  if (!payload) {
    return { displayText: aiResponse, proposals: [] };
  }

  const description = extractDescriptionFromObject(payload);
  const proposals = parseStructuredAiResponse(prompt, aiResponse, attemptIndex, targetPath);
  return {
    displayText: description || aiResponse,
    proposals,
  };
};

export const parseStructuredAiResponse = (
  prompt: string,
  aiResponse: string,
  attemptIndex: number,
  targetPath?: string,
): Proposal[] => {
  const payload = parseJsonPayload(aiResponse);
  if (!payload) return [];

  const filePatches = extractFilesFromObject(payload);
  if (filePatches.length > 0) {
    return filePatches.map((item, index) => ({
      id: nowId(),
      title: `Proposal: update ${item.path}`,
      description: "Structured response returned file-level changes.",
      patch: item.content,
      targetPath: item.path,
      createPath: true,
      isHallucination: attemptIndex % 7 === 6,
      status: "pending",
      sourcePrompt: prompt,
    }));
  }

  const extractedCode = extractCodeFromObject(payload);
  if (!extractedCode) return [];

  const isLikelyOutOfScope =
    /social login|analytics tracking|extra feature|additionally implement/i.test(extractedCode) && !/social|analytics/i.test(prompt);

  return [
    {
      id: nowId(),
      title: "Proposal: apply structured AI response",
      description: isLikelyOutOfScope
        ? "Structured response includes possible out-of-scope additions. Review before accepting."
        : "Structured response converted to an editor-ready code patch.",
      patch: normalizeCodeText(extractedCode),
      targetPath,
      createPath: false,
      isHallucination: isLikelyOutOfScope || attemptIndex % 5 === 4,
      status: "pending",
      sourcePrompt: prompt,
    },
  ];
};

export const buildProposalFromPrompt = (
  prompt: string,
  aiResponse: string,
  attemptIndex: number,
): Proposal => {
  const hallucinates = attemptIndex % 4 === 3;
  const description = hallucinates
    ? "AI proposes additional features beyond ticket scope. Candidate should reject unless justified."
    : "AI proposes a practical patch aligned to the main ticket.";

  const patch =
    hallucinates
      ? hallucinatedPatch()
      : `// AI patch from prompt\n` +
        `// ${safeTrim(prompt, "Improve login flow")}\n` +
        `// ${safeTrim(aiResponse, "Add validation, loading, and error states.").slice(0, 180)}`;

  return {
    id: nowId(),
    title: hallucinates ? "Proposal: extra features (off-scope check)" : "Proposal: login flow improvement",
    description,
    patch,
    isHallucination: hallucinates,
    status: "pending",
    sourcePrompt: prompt,
  };
};

export const applyProposalPatch = (currentCode: string, proposal: Proposal): string => {
  const code = currentCode?.trim() ?? "";
  const patch = proposal.patch?.trim() ?? "";
  if (!patch) return code;

  const looksLikeFullFile = /export\s+default|import\s+React|const\s+\w+\s*=\s*\(\)\s*=>|function\s+\w+\s*\(/i.test(patch);
  if (looksLikeFullFile) {
    return `${patch}\n`;
  }

  if (!code) return `${patch}\n`;
  return `${code}\n\n${patch}\n`;
};

export const computeTelemetry = (draft: SubmissionDraft) => {
  const proposals =
    draft.proposals && draft.proposals.length > 0
      ? draft.proposals
      : Object.values(draft.workspaceByProblem ?? {}).flatMap((workspace) => workspace.proposals ?? []);
  const prompts =
    draft.promptAttempts && draft.promptAttempts.length > 0
      ? draft.promptAttempts
      : Object.values(draft.workspaceByProblem ?? {}).flatMap((workspace) => workspace.promptAttempts ?? []);
  const accepted = proposals.filter((item) => item.status === "accepted").length;
  const declined = proposals.filter((item) => item.status === "declined").length;
  const acceptedHallucinations = proposals.filter((item) => item.isHallucination && item.status === "accepted").length;
  return {
    promptCount: prompts.length,
    proposalCount: proposals.length,
    acceptedCount: accepted,
    declinedCount: declined,
    acceptedHallucinations,
    acceptanceRatio: proposals.length > 0 ? accepted / proposals.length : 0,
  };
};

export const simulateApiResponse = (method: string, path: string, body: string) => {
  const normalizedPath = path.trim().toLowerCase();
  if (normalizedPath.includes("/auth/login") && method === "POST") {
    if (body.includes("password")) {
      return JSON.stringify({ status: 200, token: "mock-jwt-token", user: { id: "u1", role: "developer" } }, null, 2);
    }
    return JSON.stringify({ status: 400, message: "Missing credentials" }, null, 2);
  }
  return JSON.stringify({ status: 404, message: `No mock route for ${method} ${path}` }, null, 2);
};
