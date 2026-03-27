"use client";

import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { Button, Card, Input, Space, Tag, Typography } from "antd";
import { ChevronDown, ChevronRight, FilePlus2, FolderPlus, Play, Trash2 } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { SandpackLayout, SandpackPreview, SandpackProvider } from "@codesandbox/sandpack-react";
import { AssessmentMode, SubmissionDraft } from "./types";
import { TerminalView } from "./TerminalView";

type Props = {
  draft: SubmissionDraft;
  problemTitle?: string;
  problemLanguage?: string;
  files: Record<string, string>;
  folders: string[];
  fileOrder: string[];
  activeFilePath: string;
  terminalLogs: string[];
  onCodeChange: (value: string) => void;
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string) => void;
  onCreateFolder: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onReorderFiles: (nextOrder: string[]) => void;
  onMoveFile: (sourcePath: string, targetPath: string) => void;
  onModeChange: (mode: AssessmentMode) => void;
  onApiChange: (payload: Partial<SubmissionDraft["apiPlayground"]>) => void;
  onRunApi: () => void;
  styles: Record<string, string>;
  modeLocked?: boolean;
};

type EditorLanguage = "typescript" | "javascript" | "typescriptreact" | "javascriptreact";

const normalizeLanguage = (language?: string): EditorLanguage => {
  const value = (language ?? "").toLowerCase().trim();
  if (value === "tsx" || value === "typescriptreact") return "typescriptreact";
  if (value === "jsx" || value === "javascriptreact") return "javascriptreact";
  if (value === "ts" || value === "typescript") return "typescript";
  if (value === "js" || value === "javascript") return "javascript";
  return "typescriptreact";
};

const detectLanguageFromPath = (path: string, fallback?: string): EditorLanguage => {
  const normalized = (path ?? "").toLowerCase();
  if (normalized.endsWith(".tsx")) return "typescriptreact";
  if (normalized.endsWith(".jsx")) return "javascriptreact";
  if (normalized.endsWith(".ts")) return "typescript";
  if (normalized.endsWith(".js")) return "javascript";
  if (normalized.endsWith(".json")) return "javascript";
  if (normalized.endsWith(".cs")) return "typescript";
  return normalizeLanguage(fallback);
};

const renderPreview = (code: string, mode: AssessmentMode, editorLanguage: EditorLanguage, styles: Record<string, string>) => {
  if (mode === "backend") {
    return null;
  }

  const useTsTemplate = editorLanguage === "typescriptreact" || editorLanguage === "typescript";
  const appFile = useTsTemplate ? "/App.tsx" : "/App.jsx";
  const indexFile = useTsTemplate ? "/index.tsx" : "/index.jsx";
  const appSource = code?.trim().length
    ? code
    : `export default function App() { return <div style={{padding:16,color:"#e2e8f0"}}>Build your UI here.</div>; }`;

  return (
    <Card size="small" title="Live Preview" className={styles.workbenchPanel}>
      <SandpackProvider
        template={useTsTemplate ? "react-ts" : "react"}
        files={{
          [appFile]: appSource,
          [indexFile]: `import React from "react"; import { createRoot } from "react-dom/client"; import App from "./App"; const root = createRoot(document.getElementById("root")!); root.render(<App />);`,
        }}
        customSetup={{ entry: indexFile }}
        options={{ recompileMode: "immediate", recompileDelay: 300 }}
      >
        <SandpackLayout>
          <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton={false} />
        </SandpackLayout>
      </SandpackProvider>
    </Card>
  );
};

const renderApiPlayground = (draft: SubmissionDraft, onApiChange: Props["onApiChange"], onRunApi: Props["onRunApi"], styles: Record<string, string>) => (
  <Card size="small" title="API Playground" className={styles.workbenchPanel}>
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      <Input addonBefore="Method" value={draft.apiPlayground.method} onChange={(event) => onApiChange({ method: event.target.value as SubmissionDraft["apiPlayground"]["method"] })} />
      <Input addonBefore="Path" value={draft.apiPlayground.path} onChange={(event) => onApiChange({ path: event.target.value })} />
      <Input.TextArea rows={5} placeholder="Request body" value={draft.apiPlayground.body} onChange={(event) => onApiChange({ body: event.target.value })} />
      <Button icon={<Play size={14} />} onClick={onRunApi}>Run request</Button>
      <Input.TextArea rows={8} value={draft.apiPlayground.response} readOnly />
    </Space>
  </Card>
);

export const WorkbenchPanel = ({
  draft,
  problemTitle,
  problemLanguage,
  files,
  folders,
  fileOrder,
  activeFilePath,
  terminalLogs,
  onCodeChange,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onReorderFiles,
  onMoveFile,
  onModeChange,
  onApiChange,
  onRunApi,
  styles,
  modeLocked,
}: Props) => {
  const [newFilePath, setNewFilePath] = useState("");
  const [newFolderPath, setNewFolderPath] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [dragTarget, setDragTarget] = useState<string>("");
  const activeCode = files[activeFilePath] ?? "";
  const editorLanguage = detectLanguageFromPath(activeFilePath, problemLanguage);
  const sortedFiles = useMemo(() => {
    const paths = Object.keys(files);
    if (!Array.isArray(fileOrder) || fileOrder.length === 0) return paths.sort((a, b) => a.localeCompare(b));
    const ordered = fileOrder.filter((path) => paths.includes(path));
    const missing = paths.filter((path) => !ordered.includes(path)).sort((a, b) => a.localeCompare(b));
    return [...ordered, ...missing];
  }, [fileOrder, files]);
  const [previewCode, setPreviewCode] = useState(activeCode);
  const canRenderPreview = useMemo(() => {
    const path = activeFilePath.toLowerCase();
    return path.endsWith(".tsx") || path.endsWith(".jsx") || path.endsWith(".ts") || path.endsWith(".js");
  }, [activeFilePath]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewCode(activeCode), 300);
    return () => window.clearTimeout(timer);
  }, [activeCode]);

  useEffect(() => {
    setExpandedFolders((prev) => {
      if (prev.length > 0) return prev;
      return [...folders];
    });
  }, [folders]);

  const rootFiles = useMemo(() => sortedFiles.filter((path) => !path.includes("/")), [sortedFiles]);
  const topFolders = useMemo(() => folders.filter((folder) => !folder.includes("/")).sort((a, b) => a.localeCompare(b)), [folders]);

  const getDirectChildrenFolders = (folder: string) =>
    folders
      .filter((entry) => entry.startsWith(`${folder}/`) && !entry.slice(folder.length + 1).includes("/"))
      .sort((a, b) => a.localeCompare(b));

  const getDirectFiles = (folder: string) =>
    sortedFiles.filter((path) => path.startsWith(`${folder}/`) && !path.slice(folder.length + 1).includes("/"));

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) => (prev.includes(folder) ? prev.filter((item) => item !== folder) : [...prev, folder]));
  };

  const moveToFolder = (sourcePath: string, folderPath: string) => {
    const fileName = sourcePath.split("/").pop() ?? sourcePath;
    const targetPath = folderPath ? `${folderPath}/${fileName}` : fileName;
    onMoveFile(sourcePath, targetPath);
  };

  const renderFileRow = (path: string, depth: number) => (
    <div
      key={path}
      className={`${styles.fileRow} ${dragTarget === `file:${path}` ? styles.dragTarget : ""}`}
      style={{ paddingLeft: depth * 12 }}
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/plain", path)}
      onDragOver={(event) => {
        event.preventDefault();
        setDragTarget(`file:${path}`);
      }}
      onDragLeave={() => setDragTarget("")}
      onDrop={(event) => {
        event.preventDefault();
        setDragTarget("");
        const dragged = event.dataTransfer.getData("text/plain");
        if (!dragged || dragged === path) return;
        const current = [...sortedFiles];
        const withoutDragged = current.filter((item) => item !== dragged);
        const targetIndex = withoutDragged.findIndex((item) => item === path);
        const next = [...withoutDragged];
        next.splice(targetIndex < 0 ? next.length : targetIndex, 0, dragged);
        onReorderFiles(next);
      }}
    >
      <Button type={path === activeFilePath ? "primary" : "default"} size="small" onClick={() => onSelectFile(path)} className={styles.fileButton}>
        {path.split("/").pop()}
      </Button>
      <Button danger type="text" size="small" icon={<Trash2 size={14} />} onClick={() => onDeleteFile(path)} />
    </div>
  );

  const renderFolderNode = (folderPath: string, depth: number) => {
    const expanded = expandedFolders.includes(folderPath);
    const childFolders = getDirectChildrenFolders(folderPath);
    const childFiles = getDirectFiles(folderPath);

    return (
      <div key={folderPath}>
        <div
          className={`${styles.folderRow} ${dragTarget === `folder:${folderPath}` ? styles.dragTarget : ""}`}
          style={{ paddingLeft: depth * 12 }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragTarget(`folder:${folderPath}`);
          }}
          onDragLeave={() => setDragTarget("")}
          onDrop={(event) => {
            event.preventDefault();
            setDragTarget("");
            const dragged = event.dataTransfer.getData("text/plain");
            if (!dragged) return;
            moveToFolder(dragged, folderPath);
          }}
        >
          <Button type="text" size="small" icon={expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />} onClick={() => toggleFolder(folderPath)}>
            {folderPath.split("/").pop()}
          </Button>
        </div>
        {expanded ? (
          <div>
            {childFolders.map((child) => renderFolderNode(child, depth + 1))}
            {childFiles.map((file) => renderFileRow(file, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <Card title={problemTitle ? `Assessment Workbench - ${problemTitle}` : "Assessment Workbench"}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        {!modeLocked ? (
          <Button.Group>
            <Button type={draft.mode === "frontend" ? "primary" : "default"} onClick={() => onModeChange("frontend")}>Frontend</Button>
            <Button type={draft.mode === "backend" ? "primary" : "default"} onClick={() => onModeChange("backend")}>Backend/API</Button>
            <Button type={draft.mode === "fullstack" ? "primary" : "default"} onClick={() => onModeChange("fullstack")}>End-to-end</Button>
          </Button.Group>
        ) : (
          <Tag>Mode locked by assessment: {draft.mode}</Tag>
        )}

        <Group orientation="horizontal" className={styles.panelGroup}>
          <Panel defaultSize={22} minSize={14}>
            <Card size="small" title="Files" className={styles.workbenchPanel}>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Space.Compact style={{ width: "100%" }}>
                  <Input value={newFolderPath} onChange={(event) => setNewFolderPath(event.target.value)} placeholder="new-folder" />
                  <Button
                    icon={<FolderPlus size={14} />}
                    onClick={() => {
                      if (!newFolderPath.trim()) return;
                      onCreateFolder(newFolderPath.trim());
                      setNewFolderPath("");
                    }}
                  />
                </Space.Compact>
                <Space.Compact style={{ width: "100%" }}>
                  <Input value={newFilePath} onChange={(event) => setNewFilePath(event.target.value)} placeholder="src/Controllers/BooksController.cs" />
                  <Button
                    icon={<FilePlus2 size={14} />}
                    onClick={() => {
                      if (!newFilePath.trim()) return;
                      onCreateFile(newFilePath.trim());
                      setNewFilePath("");
                    }}
                  />
                </Space.Compact>

                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Typography.Text type="secondary">Workspace</Typography.Text>
                  {topFolders.map((folder) => renderFolderNode(folder, 0))}
                  {rootFiles.map((path) => renderFileRow(path, 0))}
                </Space>
              </Space>
            </Card>
          </Panel>

          <Separator className={styles.resizeHandle} />

          <Panel defaultSize={44} minSize={30}>
            <div className={styles.vscodeColumn}>
              <div className={styles.panelHeader}>
                <Typography.Text strong>{activeFilePath || "No file selected"}</Typography.Text>
                <Tag>{draft.mode}</Tag>
              </div>
              <Editor
                height="460px"
                language={editorLanguage}
                theme="vs-dark"
                value={activeCode}
                options={{ minimap: { enabled: true }, fontSize: 13, wordWrap: "on", automaticLayout: true }}
                onChange={(value) => onCodeChange(value ?? "")}
              />
              <div className={styles.terminalPanel}>
                <Typography.Text strong>Terminal</Typography.Text>
                <TerminalView className={styles.terminalShell} lines={terminalLogs} />
              </div>
            </div>
          </Panel>

          <Separator className={styles.resizeHandle} />

          <Panel defaultSize={34} minSize={24}>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              {draft.mode !== "backend" && canRenderPreview ? renderPreview(previewCode, draft.mode, editorLanguage, styles) : null}
              {draft.mode !== "frontend" ? renderApiPlayground(draft, onApiChange, onRunApi, styles) : null}
            </Space>
          </Panel>
        </Group>
      </Space>
    </Card>
  );
};
