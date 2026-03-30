import { IJobAssessmentProblem } from "@/providers/job-provider";
import { ApiPlaygroundState, TaskWorkspace } from "./types";

const DEFAULT_API: ApiPlaygroundState = {
  method: "POST",
  path: "/api/auth/login",
  body: JSON.stringify({ email: "user@example.com", password: "******" }, null, 2),
  response: "",
};

const normalizeLang = (language?: string) => (language ?? "").toLowerCase().trim();

const defaultFilePath = (problem: IJobAssessmentProblem): string => {
  const language = normalizeLang(problem.language);
  if (language === "c#" || language === "csharp" || language === "cs") return "Program.cs";
  if (language === "tsx" || language === "typescriptreact") return "src/App.tsx";
  if (language === "jsx" || language === "javascriptreact") return "src/App.jsx";
  if (language === "typescript" || language === "ts") return "src/main.ts";
  if (language === "javascript" || language === "js") return "src/main.js";
  return "src/main.txt";
};

const folderListFromFiles = (files: Record<string, string>): string[] => {
  const output = new Set<string>();
  Object.keys(files).forEach((path) => {
    const segments = path.split("/").filter(Boolean);
    if (segments.length <= 1) return;
    let acc = "";
    segments.slice(0, -1).forEach((segment) => {
      acc = acc ? `${acc}/${segment}` : segment;
      output.add(acc);
    });
  });
  return Array.from(output).sort((a, b) => a.localeCompare(b));
};

export const createWorkspaceForProblem = (problem: IJobAssessmentProblem): TaskWorkspace => {
  const starterPath = defaultFilePath(problem);
  const files: Record<string, string> = {
    [starterPath]: problem.starterCode || "",
  };
  return {
    files,
    activeFilePath: starterPath,
    folders: folderListFromFiles(files),
    fileOrder: [starterPath],
    promptAttempts: [],
    proposals: [],
    terminalLogs: ["$ workspace initialized", "$ waiting for candidate"],
    apiPlayground: { ...DEFAULT_API },
  };
};

export const ensureWorkspaceMap = (
  current: Record<string, TaskWorkspace>,
  problems: IJobAssessmentProblem[],
): Record<string, TaskWorkspace> => {
  const next = { ...current };
  problems.forEach((problem) => {
    if (!next[problem.id]) {
      next[problem.id] = createWorkspaceForProblem(problem);
      return;
    }

    const existing = next[problem.id];
    if (!existing.files || Object.keys(existing.files).length === 0) {
      next[problem.id] = createWorkspaceForProblem(problem);
    } else {
      next[problem.id] = {
        ...existing,
        folders: existing.folders && existing.folders.length > 0 ? existing.folders : folderListFromFiles(existing.files),
        fileOrder:
          Array.isArray(existing.fileOrder) && existing.fileOrder.length > 0
            ? existing.fileOrder.filter((path) => Object.prototype.hasOwnProperty.call(existing.files ?? {}, path))
            : Object.keys(existing.files ?? {}).sort((a, b) => a.localeCompare(b)),
        apiPlayground: { ...DEFAULT_API, ...(existing.apiPlayground ?? {}) },
      };
    }
  });
  return next;
};

export const createEmptyWorkspace = (): TaskWorkspace => ({
  files: { "src/main.ts": "" },
  activeFilePath: "src/main.ts",
  folders: ["src"],
  fileOrder: ["src/main.ts"],
  promptAttempts: [],
  proposals: [],
  terminalLogs: ["$ workspace initialized", "$ waiting for candidate"],
  apiPlayground: { ...DEFAULT_API },
});

export const getSortedFilePaths = (workspace: TaskWorkspace): string[] =>
  Object.keys(workspace.files ?? {}).sort((a, b) => a.localeCompare(b));

export const upsertFileContent = (workspace: TaskWorkspace, path: string, content: string): TaskWorkspace => {
  const files = { ...(workspace.files ?? {}), [path]: content };
  const existingOrder = Array.isArray(workspace.fileOrder) ? [...workspace.fileOrder] : [];
  const fileOrder = existingOrder.includes(path) ? existingOrder : [...existingOrder, path];
  return {
    ...workspace,
    files,
    fileOrder,
    activeFilePath: workspace.activeFilePath || path,
    folders: folderListFromFiles(files),
  };
};

export const removeFilePath = (workspace: TaskWorkspace, path: string): TaskWorkspace => {
  const files = { ...(workspace.files ?? {}) };
  delete files[path];
  const sorted = Object.keys(files).sort((a, b) => a.localeCompare(b));
  const fileOrder = (workspace.fileOrder ?? []).filter((item) => item !== path && Object.prototype.hasOwnProperty.call(files, item));
  return {
    ...workspace,
    files,
    fileOrder: fileOrder.length > 0 ? fileOrder : sorted,
    activeFilePath: sorted[0] ?? "",
    folders: folderListFromFiles(files),
  };
};
