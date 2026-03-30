"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Input, Space, Spin, Tag, Typography } from "antd";
import { ChevronLeft, ChevronRight, Save, Send } from "lucide-react";
import {
  Group,
  Panel,
  PanelImperativeHandle,
  Separator,
} from "react-resizable-panels";
import { toast } from "@/components/providers";
import {
  IJobAssessment,
  IJobAssessmentProblem,
  useJobAction,
} from "@/providers/job-provider";
import { AiPanel } from "./AiPanel";
import { WorkbenchPanel } from "./WorkbenchPanel";
import {
  applyProposalPatch,
  buildProposalFromPrompt,
  computeTelemetry,
  parseDraft,
  parseStructuredAiEnvelope,
  simulateApiResponse,
} from "./mockEngine";
import { EMPTY_DRAFT, SubmissionDraft, TaskWorkspace } from "./types";
import {
  createEmptyWorkspace,
  ensureWorkspaceMap,
  upsertFileContent,
  removeFilePath,
} from "./workspace";
import { useStyles } from "./style";

type AppliedHistory = {
  taskId: string;
  proposalId: string;
  targetPath: string;
  previousCode: string;
  existedBefore: boolean;
};

const DEFAULT_HTML_SCAFFOLD = `<html>
<head>
  <style>
    *{
      color: white;
    }
  </style>
</head>
<body>

  <h1>Hello</h1>
</body>
</html>`;

const getDefaultFileContent = (path: string): string => {
  const normalized = (path ?? "").toLowerCase();
  if (normalized.endsWith(".html") || normalized.endsWith(".htm")) {
    return DEFAULT_HTML_SCAFFOLD;
  }
  return "";
};

const joinWorkspaceFiles = (workspace: TaskWorkspace): string => {
  const files = Object.entries(workspace.files ?? {}).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  return files
    .map(([path, content]) => `// FILE: ${path}\n${content ?? ""}`)
    .join("\n\n");
};

const AssessmentPage = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { styles } = useStyles();
  const {
    getAssessment,
    runAssessmentPrompt,
    saveAssessmentDraft,
    submitAssessment,
  } = useJobAction();

  const assessmentId = String(params?.id ?? "");
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [askingAi, setAskingAi] = useState(false);
  const [assessment, setAssessment] = useState<IJobAssessment | null>(null);
  const [promptInput, setPromptInput] = useState("");
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [draft, setDraft] = useState<SubmissionDraft>({ ...EMPTY_DRAFT });
  const [isLargeDevice, setIsLargeDevice] = useState(true);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [accessBlockedMessage, setAccessBlockedMessage] = useState("");
  const appliedProposalHistoryRef = useRef<AppliedHistory[]>([]);
  const copilotPanelRef = useRef<PanelImperativeHandle | null>(null);

  const selectedProblemId =
    draft.selectedProblemId || assessment?.problems?.[0]?.id || "";
  const selectedProblem = useMemo(
    () =>
      assessment?.problems?.find(
        (problem) => problem.id === selectedProblemId,
      ) ??
      assessment?.problems?.[0] ??
      null,
    [assessment?.problems, selectedProblemId],
  );
  const activeWorkspace = useMemo(
    () => draft.workspaceByProblem[selectedProblemId] ?? createEmptyWorkspace(),
    [draft.workspaceByProblem, selectedProblemId],
  );

  const sleep = (ms: number) =>
    new Promise((resolve) => window.setTimeout(resolve, ms));

  const updateActiveWorkspace = (
    mutator: (workspace: TaskWorkspace) => TaskWorkspace,
  ) => {
    if (!selectedProblemId) return;
    setDraft((prev) => {
      const current =
        prev.workspaceByProblem[selectedProblemId] ?? createEmptyWorkspace();
      return {
        ...prev,
        workspaceByProblem: {
          ...prev.workspaceByProblem,
          [selectedProblemId]: mutator(current),
        },
      };
    });
  };

  const streamAttemptResponse = async (
    attemptIndex: number,
    fullText: string,
  ) => {
    const content = fullText ?? "";
    if (!content.trim()) return;
    const step = Math.max(10, Math.ceil(content.length / 80));
    for (let cursor = step; cursor <= content.length; cursor += step) {
      const next = content.slice(0, Math.min(cursor, content.length));
      updateActiveWorkspace((workspace) => ({
        ...workspace,
        promptAttempts: workspace.promptAttempts.map((attempt, idx) =>
          idx === attemptIndex ? { ...attempt, response: next } : attempt,
        ),
      }));
      await sleep(18);
    }
  };

  const streamCodeIntoFile = async (path: string, code: string) => {
    const content = code ?? "";
    if (!content.trim()) return;
    const step = Math.max(24, Math.ceil(content.length / 90));
    for (let cursor = step; cursor <= content.length; cursor += step) {
      const next = content.slice(0, Math.min(cursor, content.length));
      updateActiveWorkspace((workspace) => {
        const updated = upsertFileContent(workspace, path, next);
        return { ...updated, activeFilePath: path };
      });
      await sleep(14);
    }
  };

  useEffect(() => {
    if (!assessmentId) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAssessment(assessmentId);
        setAssessment(data);
        setAccessBlockedMessage("");
        setGithubRepoUrl(data.submissionGithubRepo ?? "");
        const parsedDraft = parseDraft(data.submissionText);
        parsedDraft.mode =
          (data.workMode as SubmissionDraft["mode"]) || parsedDraft.mode;
        parsedDraft.workspaceByProblem = ensureWorkspaceMap(
          parsedDraft.workspaceByProblem,
          data.problems ?? [],
        );
        parsedDraft.selectedProblemId =
          parsedDraft.selectedProblemId || data.problems?.[0]?.id || "";
        setDraft(parsedDraft);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not load assessment.";
        if (/already submitted/i.test(message)) {
          setAccessBlockedMessage(
            "Assessment already submitted. You cannot access this assessment again.",
          );
        } else {
          toast.error("Assessment unavailable", message);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [assessmentId, getAssessment]);

  useEffect(() => {
    const sync = () => setIsLargeDevice(window.innerWidth >= 1024);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const telemetry = useMemo(() => computeTelemetry(draft), [draft]);
  const questions = useMemo(
    () => assessment?.interactiveQuestions ?? [],
    [assessment?.interactiveQuestions],
  );
  const unanswered = useMemo(
    () =>
      questions.filter((q) => !(draft.questionnaireAnswers[q] ?? "").trim()),
    [questions, draft.questionnaireAnswers],
  );

  const askAi = async () => {
    if (!assessment || !selectedProblem || promptInput.trim().length < 3) {
      toast.error("Prompt required", "Write a clear prompt first.");
      return;
    }

    setAskingAi(true);
    try {
      const result = await runAssessmentPrompt({
        assessmentId: assessment.id,
        problemId: selectedProblem.id,
        prompt: promptInput.trim(),
      });
      const currentAttempts = activeWorkspace.promptAttempts.length;
      const fallbackProposal = buildProposalFromPrompt(
        result.prompt,
        result.response,
        currentAttempts,
      );
      const structuredEnvelope = parseStructuredAiEnvelope(
        result.prompt,
        result.response,
        currentAttempts,
        activeWorkspace.activeFilePath,
      );
      const structuredProposals = structuredEnvelope.proposals.map(
        (proposal) => ({
          ...proposal,
          targetPath: proposal.targetPath || activeWorkspace.activeFilePath,
        }),
      );
      const apiProposals =
        Array.isArray(result.proposals) && result.proposals.length > 0
          ? result.proposals.map((item, index) => ({
              id: `${Date.now()}-${index}`,
              title: item.title || "AI suggested change",
              description: item.isHallucinationRisk
                ? "This suggestion may be out-of-scope. Review carefully before accepting."
                : "Patch aligned to your current task.",
              patch: item.patch || "",
              targetPath: activeWorkspace.activeFilePath,
              isHallucination: Boolean(item.isHallucinationRisk),
              status: "pending" as const,
              sourcePrompt: result.prompt,
            }))
          : [];
      const proposalsFromApi =
        structuredProposals.length > 0
          ? structuredProposals
          : apiProposals.length > 0
            ? apiProposals
            : [fallbackProposal];
      const autoPatch = structuredProposals[0]?.patch?.trim() ?? "";
      const autoPath =
        structuredProposals[0]?.targetPath || activeWorkspace.activeFilePath;
      let nextAttemptIndex = -1;
      let shouldStreamCode = false;

      updateActiveWorkspace((workspace) => {
        nextAttemptIndex = workspace.promptAttempts.length;
        shouldStreamCode =
          autoPatch.length > 0 && !(workspace.files?.[autoPath] ?? "").trim();
        return {
          ...workspace,
          promptAttempts: [
            ...workspace.promptAttempts,
            {
              prompt: result.prompt,
              response: "",
              promptTokens: result.promptTokens,
              completionTokens: result.completionTokens,
              totalTokens: result.totalTokens,
              accepted: false,
            },
          ],
          proposals: [...workspace.proposals, ...proposalsFromApi],
          terminalLogs: [
            structuredProposals.length > 0
              ? "$ ai returned structured code and populated editor"
              : proposalsFromApi.length > 0
                ? `$ ai suggested ${proposalsFromApi.length} code change(s)`
                : "$ ai returned guidance without code changes",
            ...(workspace.terminalLogs ?? []),
          ].slice(0, 20),
        };
      });

      setPromptInput("");
      await streamAttemptResponse(
        nextAttemptIndex,
        structuredEnvelope.displayText || result.response,
      );
      if (shouldStreamCode && autoPath) {
        await streamCodeIntoFile(autoPath, autoPatch);
        updateActiveWorkspace((workspace) => ({
          ...workspace,
          terminalLogs: [
            "$ structured code streamed into editor",
            ...(workspace.terminalLogs ?? []),
          ].slice(0, 20),
        }));
      }
    } catch (error) {
      toast.error(
        "AI request failed",
        error instanceof Error ? error.message : "Could not run AI prompt.",
      );
    } finally {
      setAskingAi(false);
    }
  };

  const handleProposalDecision = (
    proposalId: string,
    decision: "accepted" | "declined",
  ) => {
    if (!selectedProblemId) return;
    updateActiveWorkspace((workspace) => {
      const target = workspace.proposals.find((item) => item.id === proposalId);
      const previousStatus = target?.status;
      const proposals = workspace.proposals.map((item) =>
        item.id === proposalId ? { ...item, status: decision } : item,
      );
      const targetPath = target?.targetPath || workspace.activeFilePath;
      const files = { ...(workspace.files ?? {}) };

      if (decision === "accepted" && target && previousStatus !== "accepted") {
        const currentCode = files[targetPath] ?? "";
        appliedProposalHistoryRef.current.push({
          taskId: selectedProblemId,
          proposalId,
          targetPath,
          previousCode: currentCode,
          existedBefore: Object.prototype.hasOwnProperty.call(
            files,
            targetPath,
          ),
        });
        files[targetPath] = applyProposalPatch(currentCode, target);
      }

      if (decision === "declined" && previousStatus === "accepted") {
        const rollbackIndex = appliedProposalHistoryRef.current.findIndex(
          (item) =>
            item.taskId === selectedProblemId && item.proposalId === proposalId,
        );
        if (rollbackIndex >= 0) {
          const rollback = appliedProposalHistoryRef.current[rollbackIndex];
          if (rollback.existedBefore) {
            files[rollback.targetPath] = rollback.previousCode;
          } else {
            delete files[rollback.targetPath];
          }
          appliedProposalHistoryRef.current.splice(rollbackIndex, 1);
        }
      }

      return {
        ...workspace,
        proposals,
        files,
        terminalLogs: [
          `$ proposal ${decision}: ${proposalId.slice(0, 8)}`,
          ...(workspace.terminalLogs ?? []),
        ].slice(0, 20),
      };
    });
  };

  const reviseProposal = (proposalId: string) => {
    const proposal = activeWorkspace.proposals.find(
      (item) => item.id === proposalId,
    );
    if (!proposal) return;
    setPromptInput(
      `Revise this change and keep it strictly within ticket scope:\n${proposal.patch}`,
    );
  };

  const saveDraft = async () => {
    if (!assessment) return;
    setSavingDraft(true);
    try {
      const draftPayload = JSON.stringify({
        mode: draft.mode,
        selectedProblemId,
        workspaceByProblem: draft.workspaceByProblem,
        collaborationResponse: draft.collaborationResponse,
        questionnaireAnswers: draft.questionnaireAnswers,
      });
      const updated = await saveAssessmentDraft({
        assessmentId: assessment.id,
        submissionText: draftPayload,
        githubRepoUrl: githubRepoUrl.trim(),
      });
      setAssessment(updated);
      toast.success("Workspace draft saved");
    } catch (error) {
      toast.error(
        "Save failed",
        error instanceof Error ? error.message : "Could not save draft.",
      );
    } finally {
      setSavingDraft(false);
    }
  };

  const runApiSimulation = () => {
    const response = simulateApiResponse(
      activeWorkspace.apiPlayground.method,
      activeWorkspace.apiPlayground.path,
      activeWorkspace.apiPlayground.body,
    );
    updateActiveWorkspace((workspace) => ({
      ...workspace,
      apiPlayground: { ...workspace.apiPlayground, response },
      terminalLogs: [
        `$ ${workspace.apiPlayground.method} ${workspace.apiPlayground.path} -> simulated`,
        ...(workspace.terminalLogs ?? []),
      ].slice(0, 20),
    }));
  };

  const submitFinal = async () => {
    if (!assessment) return;
    const hasAnyCode = Object.values(draft.workspaceByProblem).some(
      (workspace) =>
        Object.values(workspace.files ?? {}).some(
          (content) => (content ?? "").trim().length >= 20,
        ),
    );

    if (!hasAnyCode && githubRepoUrl.trim().length < 10) {
      toast.error(
        "Submission incomplete",
        "Provide implementation code/pseudocode or repository URL.",
      );
      return;
    }
    if (draft.collaborationResponse.trim().length < 10) {
      toast.error(
        "Submission incomplete",
        "Respond to the collaboration scenario.",
      );
      return;
    }
    if (unanswered.length > 0) {
      toast.error(
        "Complete questionnaire",
        "Answer all interactive questions before submitting.",
      );
      return;
    }

    const problemsPayload = (assessment.problems ?? []).map((problem) => {
      const workspace =
        draft.workspaceByProblem[problem.id] ?? createEmptyWorkspace();
      return {
        problemId: problem.id,
        code: joinWorkspaceFiles(workspace),
        files: workspace.files,
        passedPublic: 0,
        totalPublic: 0,
        promptAttempts: workspace.promptAttempts,
      };
    });

    const submissionText = JSON.stringify({
      mode: draft.mode,
      selectedProblemId,
      workspaceByProblem: draft.workspaceByProblem,
      collaborationResponse: draft.collaborationResponse,
      problems: problemsPayload,
      questionnaireAnswers: draft.questionnaireAnswers,
      telemetry,
      submittedAt: new Date().toISOString(),
    });

    setSubmitting(true);
    try {
      const updated = await submitAssessment({
        assessmentId: assessment.id,
        submissionText,
        githubRepoUrl: githubRepoUrl.trim(),
      });
      setAssessment(updated);
      toast.success("Assessment submitted");
    } catch (error) {
      toast.error(
        "Submit failed",
        error instanceof Error ? error.message : "Could not submit assessment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectProblem = (problem: IJobAssessmentProblem) => {
    setDraft((prev) => ({
      ...prev,
      selectedProblemId: problem.id,
      workspaceByProblem: ensureWorkspaceMap(
        prev.workspaceByProblem,
        assessment?.problems ?? [],
      ),
    }));
  };

  const toggleCopilotPanel = () => {
    if (!copilotPanelRef.current) return;
    if (isCopilotOpen) {
      copilotPanelRef.current.collapse();
      return;
    }
    copilotPanelRef.current.expand();
  };

  if (loading)
    return (
      <div className={styles.loader}>
        <Spin size="large" />
      </div>
    );
  if (accessBlockedMessage) {
    return (
      <div className={styles.page}>
        <Card className={styles.blockedCard}>
          <Space direction="vertical" size={10}>
            <Typography.Title level={3}>Assessment Sent</Typography.Title>
            <Typography.Paragraph className={styles.muted}>
              {accessBlockedMessage}
            </Typography.Paragraph>
            <Button onClick={() => router.push("/jobs")}>Back to Jobs</Button>
          </Space>
        </Card>
      </div>
    );
  }
  if (!assessment)
    return (
      <div className={styles.page}>
        <Card>
          <Button onClick={() => router.push("/jobs")}>Back to jobs</Button>
        </Card>
      </div>
    );
  if (!isLargeDevice) {
    return (
      <div className={styles.page}>
        <Card className={styles.blockedCard}>
          <Space direction="vertical" size={10}>
            <Typography.Title level={3}>
              Larger Device Required
            </Typography.Title>
            <Typography.Paragraph className={styles.muted}>
              This assessment workbench is available on laptop/desktop only
              (minimum width: 1024px).
            </Typography.Paragraph>
          </Space>
        </Card>
      </div>
    );
  }

  const modeLabel =
    draft.mode === "backend"
      ? "Backend only"
      : draft.mode === "frontend"
        ? "Frontend only"
        : "End-to-end";
  const statusColor =
    assessment.status === "reviewed"
      ? "success"
      : assessment.status === "submitted"
        ? "gold"
        : "processing";

  return (
    <div className={styles.page}>
      <Card className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.headerIdentity}>
            <Typography.Title level={2} className={styles.heading}>
              {assessment.jobTitle} Assessment
            </Typography.Title>
            <Typography.Text className={styles.muted}>
              {assessment.companyName} • {assessment.candidateName}
            </Typography.Text>
          </div>
          <Space className={styles.headerActions}>
            <Button
              icon={<Save size={14} />}
              loading={savingDraft}
              onClick={() => void saveDraft()}
            >
              Save Workspace
            </Button>
            <Button
              type="primary"
              icon={<Send size={14} />}
              loading={submitting}
              disabled={assessment.status !== "pending"}
              onClick={() => void submitFinal()}
            >
              Submit Assessment
            </Button>
          </Space>
        </div>
        <Space size={8} wrap className={styles.headerMeta}>
          <Tag color={statusColor}>Status: {assessment.status}</Tag>
          <Tag>Mode: {modeLabel}</Tag>
          <Tag>AI usage: Advised</Tag>
        </Space>
      </Card>

      <Card title="Assessment Brief" className={styles.formCard}>
        {selectedProblem ? (
          <>
            <Typography.Title level={4} style={{ marginTop: 0 }}>
              {selectedProblem.title}
            </Typography.Title>
            <Typography.Paragraph>
              {selectedProblem.description}
            </Typography.Paragraph>
          </>
        ) : (
          <Typography.Paragraph>{assessment.prompt}</Typography.Paragraph>
        )}
        <Typography.Paragraph className={styles.muted}>
          {assessment.instructions}
        </Typography.Paragraph>
        {assessment.endpointHints && assessment.endpointHints.length > 0 ? (
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Typography.Text strong>Available endpoint hints</Typography.Text>
            {assessment.endpointHints.map((endpoint) => (
              <Tag key={endpoint}>{endpoint}</Tag>
            ))}
          </Space>
        ) : null}
      </Card>

      <Card title="Tasks" className={styles.formCard}>
        <Space wrap>
          {(assessment.problems ?? []).map((problem, idx) => (
            <Button
              key={problem.id}
              type={problem.id === selectedProblemId ? "primary" : "default"}
              onClick={() => handleSelectProblem(problem)}
            >
              Task {idx + 1}: {problem.title}
            </Button>
          ))}
        </Space>
      </Card>

      <div className={styles.workspaceToolbar}>
        <Typography.Text strong>Connected Workspace</Typography.Text>
        <Button
          size="small"
          type="text"
          icon={isCopilotOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          onClick={toggleCopilotPanel}
        >
          {isCopilotOpen ? "Hide Copilot" : "Show Copilot"}
        </Button>
      </div>
      <Group orientation="horizontal" className={styles.workbenchWithCopilot}>
        <Panel defaultSize={68} minSize={45}>
          <WorkbenchPanel
            draft={draft}
            problemTitle={selectedProblem?.title}
            problemLanguage={selectedProblem?.language}
            files={activeWorkspace.files}
            folders={activeWorkspace.folders}
            fileOrder={activeWorkspace.fileOrder}
            activeFilePath={activeWorkspace.activeFilePath}
            terminalLogs={activeWorkspace.terminalLogs}
            styles={styles}
            onCodeChange={(value) =>
              updateActiveWorkspace((workspace) =>
                upsertFileContent(workspace, workspace.activeFilePath, value),
              )
            }
            onSelectFile={(path) =>
              updateActiveWorkspace((workspace) => ({
                ...workspace,
                activeFilePath: path,
              }))
            }
            onCreateFolder={(path) =>
              updateActiveWorkspace((workspace) => ({
                ...workspace,
                folders: Array.from(
                  new Set([...(workspace.folders ?? []), path]),
                ),
              }))
            }
            onCreateFile={(path) =>
              updateActiveWorkspace((workspace) => ({
                ...upsertFileContent(workspace, path, getDefaultFileContent(path)),
                activeFilePath: path,
              }))
            }
            onDeleteFile={(path) =>
              updateActiveWorkspace((workspace) =>
                removeFilePath(workspace, path),
              )
            }
            onReorderFiles={(order) =>
              updateActiveWorkspace((workspace) => ({
                ...workspace,
                fileOrder: order.filter((item) =>
                  Object.prototype.hasOwnProperty.call(
                    workspace.files ?? {},
                    item,
                  ),
                ),
              }))
            }
            onMoveFile={(sourcePath, targetPath) =>
              updateActiveWorkspace((workspace) => {
                if (!sourcePath || !targetPath || sourcePath === targetPath) {
                  return workspace;
                }
                const files = { ...(workspace.files ?? {}) };
                if (!Object.prototype.hasOwnProperty.call(files, sourcePath)) {
                  return workspace;
                }
                const sourceContent = files[sourcePath];
                delete files[sourcePath];
                files[targetPath] = sourceContent;

                const nextOrder = (workspace.fileOrder ?? [])
                  .map((item) => (item === sourcePath ? targetPath : item))
                  .filter((item, index, arr) => arr.indexOf(item) === index);
                if (!nextOrder.includes(targetPath)) {
                  nextOrder.push(targetPath);
                }

                return {
                  ...workspace,
                  files,
                  fileOrder: nextOrder,
                  activeFilePath:
                    workspace.activeFilePath === sourcePath
                      ? targetPath
                      : workspace.activeFilePath,
                  folders: Array.from(
                    new Set([
                      ...(workspace.folders ?? []),
                      ...Object.keys(files)
                        .filter((p) => p.includes("/"))
                        .map((p) => p.split("/").slice(0, -1).join("/"))
                        .filter(Boolean),
                    ]),
                  ),
                };
              })
            }
            onModeChange={(mode) => setDraft((prev) => ({ ...prev, mode }))}
            onApiChange={(payload) =>
              updateActiveWorkspace((workspace) => ({
                ...workspace,
                apiPlayground: { ...workspace.apiPlayground, ...payload },
              }))
            }
            onRunApi={runApiSimulation}
            modeLocked
          />
        </Panel>
        {isCopilotOpen ? <Separator className={styles.resizeHandle} /> : null}
        <Panel
          panelRef={copilotPanelRef}
          defaultSize={32}
          minSize={22}
          collapsible
          collapsedSize={0}
          onResize={(size) => setIsCopilotOpen(size.asPercentage > 0)}
        >
          <div className={styles.copilotRail}>
            <AiPanel
              promptInput={promptInput}
              loading={askingAi}
              attempts={activeWorkspace.promptAttempts}
              proposals={activeWorkspace.proposals}
              currentCode={
                activeWorkspace.files[activeWorkspace.activeFilePath] ?? ""
              }
              currentFilePath={activeWorkspace.activeFilePath}
              editorLanguage={selectedProblem?.language}
              onPromptInput={setPromptInput}
              onAskAi={() => void askAi()}
              onAcceptPromptAttempt={(index) =>
                updateActiveWorkspace((workspace) => ({
                  ...workspace,
                  promptAttempts: workspace.promptAttempts.map(
                    (item, itemIndex) => ({
                      ...item,
                      accepted: itemIndex === index,
                    }),
                  ),
                }))
              }
              onProposalDecision={handleProposalDecision}
              onReviseProposal={reviseProposal}
              styles={styles}
            />
          </div>
        </Panel>
      </Group>

      <Card title="Interactive Questionnaire" className={styles.formCard}>
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <Alert
            className={styles.questionnaireAlert}
            showIcon
            message="Complete all responses before submitting."
          />
          {questions.map((question) => (
            <div key={question} className={styles.inputCol}>
              <Typography.Text strong>{question}</Typography.Text>
              <Input.TextArea
                rows={3}
                value={draft.questionnaireAnswers[question] ?? ""}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    questionnaireAnswers: {
                      ...prev.questionnaireAnswers,
                      [question]: event.target.value,
                    },
                  }))
                }
              />
            </div>
          ))}
        </Space>
      </Card>

      {assessment.status !== "pending" ? (
        <Card title="Assessment Sent">
          <Typography.Paragraph>
            Your assessment has been submitted successfully.
          </Typography.Paragraph>
          <Typography.Paragraph className={styles.muted}>
            Results are shared internally with the hiring team. You can no
            longer edit or re-open this assessment.
          </Typography.Paragraph>
        </Card>
      ) : null}
    </div>
  );
};

export default AssessmentPage;
