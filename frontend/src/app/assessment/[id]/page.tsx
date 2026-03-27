"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { Alert, Button, Card, Input, Space, Spin, Tabs, Tag, Typography } from "antd";
import { Bot, CheckCircle, Play, Send } from "lucide-react";
import { toast } from "@/components/providers";
import { IJobAssessment, IJobAssessmentProblem, useJobAction } from "@/providers/job-provider";
import { useStyles } from "./style";

type IRunDetails = {
  input: string;
  expectedOutput: string;
  output: string;
  passed: boolean;
};

type IRunResult = {
  passed: number;
  total: number;
  details: IRunDetails[];
  error?: string;
};

type IPromptAttempt = {
  prompt: string;
  response: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  accepted: boolean;
};

const parseSubmissionDraft = (submissionText?: string) => {
  if (!submissionText) return null;
  try {
    const parsed = JSON.parse(submissionText) as {
      problems?: Array<{
        problemId?: string;
        code?: string;
        passedPublic?: number;
        totalPublic?: number;
        promptAttempts?: IPromptAttempt[];
      }>;
      notes?: string;
    };
    return parsed;
  } catch {
    return null;
  }
};

const runJavaScriptTests = async (
  code: string,
  tests: Array<{ input: string; expectedOutput: string }>,
  timeoutMs = 3000,
): Promise<IRunResult> => {
  const workerScript = `
    self.onmessage = async (event) => {
      const payload = event.data || {};
      const sourceCode = payload.code || "";
      const testCases = payload.tests || [];
      try {
        const factory = new Function(sourceCode + "\\n; return (typeof solve === 'function') ? solve : null;");
        const solveFn = factory();
        if (typeof solveFn !== "function") {
          self.postMessage({ ok: false, error: "Missing solve(input) function in code." });
          return;
        }

        const details = [];
        for (const testCase of testCases) {
          let output;
          try {
            output = await solveFn(testCase.input);
          } catch (innerError) {
            details.push({
              input: String(testCase.input ?? ""),
              expectedOutput: String(testCase.expectedOutput ?? ""),
              output: "Runtime error: " + String(innerError && innerError.message ? innerError.message : innerError),
              passed: false
            });
            continue;
          }

          const normalizedOutput = String(output ?? "").trim();
          const normalizedExpected = String(testCase.expectedOutput ?? "").trim();
          details.push({
            input: String(testCase.input ?? ""),
            expectedOutput: String(testCase.expectedOutput ?? ""),
            output: normalizedOutput,
            passed: normalizedOutput === normalizedExpected
          });
        }

        const passed = details.filter((detail) => detail.passed).length;
        self.postMessage({ ok: true, details, passed, total: details.length });
      } catch (error) {
        self.postMessage({ ok: false, error: String(error && error.message ? error.message : error) });
      }
    };
  `;

  const blobUrl = URL.createObjectURL(new Blob([workerScript], { type: "application/javascript" }));
  const worker = new Worker(blobUrl);

  return await new Promise<IRunResult>((resolve) => {
    const timer = window.setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(blobUrl);
      resolve({
        passed: 0,
        total: tests.length,
        details: [],
        error: "Execution timed out.",
      });
    }, timeoutMs);

    worker.onmessage = (event) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(blobUrl);
      const payload = event.data as {
        ok?: boolean;
        details?: IRunDetails[];
        passed?: number;
        total?: number;
        error?: string;
      };
      if (!payload.ok) {
        resolve({
          passed: 0,
          total: tests.length,
          details: [],
          error: payload.error || "Execution failed.",
        });
        return;
      }

      resolve({
        passed: Number(payload.passed ?? 0),
        total: Number(payload.total ?? tests.length),
        details: Array.isArray(payload.details) ? payload.details : [],
      });
    };

    worker.postMessage({ code, tests });
  });
};

const AssessmentPage = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { styles } = useStyles();
  const { getAssessment, runAssessmentPrompt, submitAssessment } = useJobAction();

  const assessmentId = String(params?.id ?? "");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [runningProblemId, setRunningProblemId] = useState<string>("");
  const [activeProblemId, setActiveProblemId] = useState<string>("");
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [reflectionNotes, setReflectionNotes] = useState("");
  const [promptInputs, setPromptInputs] = useState<Record<string, string>>({});
  const [promptLoading, setPromptLoading] = useState<Record<string, boolean>>({});
  const [promptAttempts, setPromptAttempts] = useState<Record<string, IPromptAttempt[]>>({});
  const [assessment, setAssessment] = useState<IJobAssessment | null>(null);
  const [solutions, setSolutions] = useState<Record<string, string>>({});
  const [runResults, setRunResults] = useState<Record<string, IRunResult>>({});

  useEffect(() => {
    if (!assessmentId) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAssessment(assessmentId);
        setAssessment(data);
        setGithubRepoUrl(data.submissionGithubRepo ?? "");

        const initialProblems = (data.problems ?? []).slice().sort((a, b) => a.order - b.order);
        const draft = parseSubmissionDraft(data.submissionText);
        const solutionMap: Record<string, string> = {};
        const resultMap: Record<string, IRunResult> = {};
        const promptDrafts: Record<string, string> = {};
        const promptAttemptMap: Record<string, IPromptAttempt[]> = {};

        initialProblems.forEach((problem) => {
          const draftProblem = draft?.problems?.find((item) => item.problemId === problem.id);
          solutionMap[problem.id] = draftProblem?.code || problem.starterCode || "";
          promptDrafts[problem.id] = "";
          promptAttemptMap[problem.id] = Array.isArray(draftProblem?.promptAttempts)
            ? draftProblem.promptAttempts.map((item) => ({
                prompt: String(item.prompt ?? ""),
                response: String(item.response ?? ""),
                promptTokens: Number(item.promptTokens ?? 0),
                completionTokens: Number(item.completionTokens ?? 0),
                totalTokens: Number(item.totalTokens ?? 0),
                accepted: Boolean(item.accepted),
              }))
            : [];
          if (typeof draftProblem?.passedPublic === "number" && typeof draftProblem?.totalPublic === "number") {
            resultMap[problem.id] = {
              passed: draftProblem.passedPublic,
              total: draftProblem.totalPublic,
              details: [],
            };
          }
        });

        setSolutions(solutionMap);
        setRunResults(resultMap);
        setPromptInputs(promptDrafts);
        setPromptAttempts(promptAttemptMap);
        setReflectionNotes(draft?.notes ?? "");
        if (initialProblems.length > 0) {
          setActiveProblemId(initialProblems[0].id);
        }
      } catch (error) {
        toast.error("Assessment unavailable", error instanceof Error ? error.message : "Could not load assessment.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [assessmentId, getAssessment]);

  const orderedProblems = useMemo(() => {
    return (assessment?.problems ?? []).slice().sort((a, b) => a.order - b.order);
  }, [assessment?.problems]);

  const activeProblem = useMemo(() => {
    return orderedProblems.find((problem) => problem.id === activeProblemId) ?? orderedProblems[0];
  }, [activeProblemId, orderedProblems]);

  const globalPublicPassRate = useMemo(() => {
    const values = orderedProblems.map((problem) => {
      const result = runResults[problem.id];
      if (!result || result.total <= 0) return 0;
      return result.passed / result.total;
    });
    if (values.length === 0) return 0;
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100);
  }, [orderedProblems, runResults]);

  const runProblem = async (problem: IJobAssessmentProblem) => {
    if (!problem) return;
    const code = (solutions[problem.id] ?? "").trim();
    if (!code) {
      toast.error("Code required", "Write code before running tests.");
      return;
    }
    setRunningProblemId(problem.id);
    try {
      const result = await runJavaScriptTests(
        code,
        (problem.publicTests ?? []).map((test) => ({ input: test.input, expectedOutput: test.expectedOutput })),
      );
      setRunResults((prev) => ({ ...prev, [problem.id]: result }));
      if (!result.error) {
        toast.success("Run complete", `${result.passed}/${result.total} public tests passed.`);
      } else {
        toast.error("Run failed", result.error);
      }
    } catch (error) {
      toast.error("Execution failed", error instanceof Error ? error.message : "Could not run tests.");
      setRunResults((prev) => ({
        ...prev,
        [problem.id]: {
          passed: 0,
          total: (problem.publicTests ?? []).length,
          details: [],
          error: "Execution crashed.",
        },
      }));
    } finally {
      setRunningProblemId("");
    }
  };

  const askAiForProblem = async (problem: IJobAssessmentProblem) => {
    if (!assessment) return;
    const prompt = (promptInputs[problem.id] ?? "").trim();
    if (prompt.length < 3) {
      toast.error("Prompt too short", "Enter a meaningful prompt for AI assistance.");
      return;
    }

    setPromptLoading((prev) => ({ ...prev, [problem.id]: true }));
    try {
      const result = await runAssessmentPrompt({
        assessmentId: assessment.id,
        problemId: problem.id,
        prompt,
      });
      setPromptAttempts((prev) => ({
        ...prev,
        [problem.id]: [
          ...(prev[problem.id] ?? []),
          {
            prompt: result.prompt,
            response: result.response,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            totalTokens: result.totalTokens,
            accepted: false,
          },
        ],
      }));
      setPromptInputs((prev) => ({ ...prev, [problem.id]: "" }));
      toast.success("AI response ready", `Tokens used: ${result.totalTokens}`);
    } catch (error) {
      toast.error("AI prompt failed", error instanceof Error ? error.message : "Could not get AI guidance.");
    } finally {
      setPromptLoading((prev) => ({ ...prev, [problem.id]: false }));
    }
  };

  const handleSubmit = async () => {
    if (!assessment) return;
    if (orderedProblems.length < 2) {
      toast.error("Assessment invalid", "At least 2 problems are required.");
      return;
    }

    const payload = {
      type: "leetcode-v1",
      submittedAt: new Date().toISOString(),
      notes: reflectionNotes.trim(),
      aggregatePublicPassRate: globalPublicPassRate,
          problems: orderedProblems.map((problem) => {
            const result = runResults[problem.id];
            return {
              problemId: problem.id,
              code: solutions[problem.id] ?? "",
              passedPublic: result?.passed ?? 0,
              totalPublic: result?.total ?? (problem.publicTests ?? []).length,
              promptAttempts: (promptAttempts[problem.id] ?? []).map((item) => ({
                prompt: item.prompt,
                response: item.response,
                promptTokens: item.promptTokens,
                completionTokens: item.completionTokens,
                totalTokens: item.totalTokens,
                accepted: item.accepted,
              })),
            };
          }),
    };

    const submissionText = JSON.stringify(payload);
    if (submissionText.length < 20) {
      toast.error("Submission too short", "Please complete the problems before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await submitAssessment({
        assessmentId: assessment.id,
        submissionText,
        githubRepoUrl: githubRepoUrl.trim(),
      });
      setAssessment(updated);
      toast.success("Assessment submitted", "Your result has been sent to the hiring team.");
    } catch (error) {
      toast.error("Submit failed", error instanceof Error ? error.message : "Could not submit assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasteBlock = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    toast.info("Paste blocked", "Pasting is disabled for this coding assessment.");
  };

  const handleCodeKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v") {
      event.preventDefault();
      toast.info("Paste blocked", "Pasting is disabled for this coding assessment.");
    }
  };

  if (loading) {
    return <div className={styles.loader}><Spin size="large" /></div>;
  }

  if (!assessment) {
    return (
      <div className={styles.page}>
        <Card>
          <Typography.Title level={4}>Assessment not found</Typography.Title>
          <Typography.Paragraph className={styles.muted}>
            The assessment link is invalid or no longer available.
          </Typography.Paragraph>
          <Button onClick={() => router.push("/jobs")}>Back to jobs</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Card className={styles.headerCard}>
        <Space direction="vertical" size={4}>
          <Typography.Title level={2} className={styles.heading}>
            {assessment.jobTitle} LeetPrompt Assessment
          </Typography.Title>
          <Typography.Text className={styles.muted}>
            {assessment.companyName} • {assessment.candidateName}
          </Typography.Text>
          <Space size={8} wrap>
            <Tag color="processing">Status: {assessment.status}</Tag>
            <Tag color={globalPublicPassRate >= 70 ? "success" : "default"}>
              Public pass rate: {globalPublicPassRate}%
            </Tag>
          </Space>
        </Space>
      </Card>

      <Card className={styles.formCard} title="Assessment Brief">
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Typography.Paragraph>{assessment.prompt}</Typography.Paragraph>
          <Typography.Paragraph className={styles.muted}>{assessment.instructions}</Typography.Paragraph>
          <Alert
            type="warning"
            showIcon
            message="Assessment Rules"
            description="You can run public tests before submission. Pasting is disabled in the code editor."
          />
        </Space>
      </Card>

      <Card className={styles.formCard} title="Problems">
        <Tabs
          activeKey={activeProblem?.id}
          onChange={setActiveProblemId}
          items={orderedProblems.map((problem) => {
            const result = runResults[problem.id];
            return {
              key: problem.id,
              label: (
                <Space size={6}>
                  <span>{problem.order}. {problem.title}</span>
                  <Tag>{result ? `${result.passed}/${result.total}` : `${problem.publicTests.length} tests`}</Tag>
                </Space>
              ),
              children: (
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Typography.Title level={4} className={styles.heading}>{problem.title}</Typography.Title>
                  <Typography.Paragraph>{problem.description}</Typography.Paragraph>

                  <div className={styles.testsGrid}>
                    {(problem.publicTests ?? []).map((test, index) => (
                      <Card key={`${problem.id}-test-${index}`} size="small" title={`Public Test ${index + 1}`}>
                        <Typography.Text strong>Input:</Typography.Text>
                        <Typography.Paragraph code>{test.input}</Typography.Paragraph>
                        <Typography.Text strong>Expected:</Typography.Text>
                        <Typography.Paragraph code>{test.expectedOutput}</Typography.Paragraph>
                        {test.hint ? <Typography.Text type="secondary">Hint: {test.hint}</Typography.Text> : null}
                      </Card>
                    ))}
                  </div>

                  <Input.TextArea
                    value={solutions[problem.id] ?? ""}
                    onChange={(event) => setSolutions((prev) => ({ ...prev, [problem.id]: event.target.value }))}
                    rows={16}
                    className={styles.codeEditor}
                    onPaste={handlePasteBlock}
                    onKeyDown={handleCodeKeyDown}
                    spellCheck={false}
                  />

                  <div className={styles.actions}>
                    <Button
                      icon={<Play size={14} />}
                      onClick={() => void runProblem(problem)}
                      loading={runningProblemId === problem.id}
                    >
                      Run Public Tests
                    </Button>
                  </div>

                  <Card size="small" title="LeetPrompt AI Assistant">
                    <Space direction="vertical" size={10} style={{ width: "100%" }}>
                      <Input.TextArea
                        value={promptInputs[problem.id] ?? ""}
                        onChange={(event) => setPromptInputs((prev) => ({ ...prev, [problem.id]: event.target.value }))}
                        rows={3}
                        placeholder="Ask AI to review your approach, suggest edge cases, or improve efficiency..."
                      />
                      <div className={styles.actions}>
                        <Button
                          icon={<Bot size={14} />}
                          onClick={() => void askAiForProblem(problem)}
                          loading={Boolean(promptLoading[problem.id])}
                        >
                          Ask AI
                        </Button>
                      </div>

                      {(promptAttempts[problem.id] ?? []).length > 0 ? (
                        <Space direction="vertical" size={8} style={{ width: "100%" }}>
                          {(promptAttempts[problem.id] ?? []).map((attempt, index) => (
                            <Card
                              key={`${problem.id}-prompt-attempt-${index}`}
                              size="small"
                              title={`Prompt ${index + 1} • ${attempt.totalTokens} tokens`}
                              extra={
                                <Button
                                  size="small"
                                  type={attempt.accepted ? "primary" : "default"}
                                  onClick={() =>
                                    setPromptAttempts((prev) => ({
                                      ...prev,
                                      [problem.id]: (prev[problem.id] ?? []).map((item, attemptIndex) => ({
                                        ...item,
                                        accepted: attemptIndex === index,
                                      })),
                                    }))
                                  }
                                >
                                  {attempt.accepted ? "Accepted" : "Mark as accepted"}
                                </Button>
                              }
                            >
                              <Typography.Paragraph>
                                <Typography.Text strong>You:</Typography.Text> {attempt.prompt}
                              </Typography.Paragraph>
                              <Typography.Paragraph style={{ marginBottom: 0 }}>
                                <Typography.Text strong>AI:</Typography.Text> {attempt.response}
                              </Typography.Paragraph>
                            </Card>
                          ))}
                        </Space>
                      ) : (
                        <Typography.Text className={styles.muted}>
                          No AI prompts yet for this problem.
                        </Typography.Text>
                      )}
                    </Space>
                  </Card>

                  {result?.error ? <Alert type="error" message={result.error} showIcon /> : null}
                  {result && !result.error ? (
                    <Card size="small" title={`Run Result: ${result.passed}/${result.total} passed`}>
                      <ul className={styles.resultList}>
                        {result.details.map((detail, index) => (
                          <li key={`${problem.id}-detail-${index}`}>
                            <Typography.Text>
                              [{detail.passed ? "PASS" : "FAIL"}] input: {detail.input} expected: {detail.expectedOutput} got: {detail.output}
                            </Typography.Text>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ) : null}
                </Space>
              ),
            };
          })}
        />
      </Card>

      <Card className={styles.formCard} title="Submission">
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <Input
            placeholder="Github repository URL (optional)"
            value={githubRepoUrl}
            onChange={(event) => setGithubRepoUrl(event.target.value)}
          />
          <Input.TextArea
            rows={5}
            placeholder="Optional notes about your approach and AI assistant usage."
            value={reflectionNotes}
            onChange={(event) => setReflectionNotes(event.target.value)}
          />
          <div className={styles.actions}>
            <Button type="primary" icon={<Send size={14} />} onClick={() => void handleSubmit()} loading={submitting}>
              Submit Final Assessment
            </Button>
          </div>
        </Space>
      </Card>

      {assessment.status === "reviewed" ? (
        <Card title="Assessment Result">
          <div className={styles.resultGrid}>
            <Card size="small" title="Score">
              <Typography.Title level={3} style={{ margin: 0 }}>{assessment.score.toFixed(1)}%</Typography.Title>
            </Card>
            <Card size="small" title="Verdict">
              <Typography.Text>{assessment.verdict || "Pending"}</Typography.Text>
            </Card>
            <Card size="small" title="Submitted">
              <Typography.Text>{assessment.submittedAt ? new Date(assessment.submittedAt).toLocaleString() : "--"}</Typography.Text>
            </Card>
          </div>
          <Space direction="vertical" size={10} style={{ width: "100%", marginTop: 16 }}>
            <div>
              <Typography.Text strong><CheckCircle size={14} /> Strengths</Typography.Text>
              <ul className={styles.resultList}>
                {(assessment.strengths?.length ? assessment.strengths : ["No strengths available yet."]).map((item) => (
                  <li key={`str-${item}`}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <Typography.Text strong>Improvement Areas</Typography.Text>
              <ul className={styles.resultList}>
                {(assessment.weaknesses?.length ? assessment.weaknesses : ["No improvement areas available yet."]).map((item) => (
                  <li key={`wk-${item}`}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <Typography.Text strong>Tips</Typography.Text>
              <ul className={styles.resultList}>
                {(assessment.tips?.length ? assessment.tips : ["No tips available yet."]).map((item) => (
                  <li key={`tip-${item}`}>{item}</li>
                ))}
              </ul>
            </div>
          </Space>
        </Card>
      ) : null}
    </div>
  );
};

export default AssessmentPage;
