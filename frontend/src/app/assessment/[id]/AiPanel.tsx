"use client";

import { useEffect, useMemo, useRef } from "react";
import { DiffEditor } from "@monaco-editor/react";
import { Button, Card, Input, Space, Typography } from "antd";
import { Bot } from "lucide-react";
import { Proposal, PromptAttempt } from "./types";
import { applyProposalPatch } from "./mockEngine";

type Props = {
  promptInput: string;
  loading: boolean;
  attempts: PromptAttempt[];
  proposals: Proposal[];
  currentCode: string;
  currentFilePath: string;
  editorLanguage?: string;
  onPromptInput: (value: string) => void;
  onAskAi: () => void;
  onAcceptPromptAttempt: (index: number) => void;
  onProposalDecision: (proposalId: string, decision: "accepted" | "declined") => void;
  onReviseProposal: (proposalId: string) => void;
};

const normalizeEditorLanguage = (language?: string): "typescript" | "javascript" | "typescriptreact" | "javascriptreact" => {
  const value = (language ?? "").toLowerCase();
  if (value === "tsx" || value === "typescriptreact") return "typescriptreact";
  if (value === "jsx" || value === "javascriptreact") return "javascriptreact";
  if (value === "js" || value === "javascript") return "javascript";
  return "typescript";
};

export const AiPanel = ({
  promptInput,
  loading,
  attempts,
  proposals,
  currentCode,
  currentFilePath,
  editorLanguage,
  onPromptInput,
  onAskAi,
  onAcceptPromptAttempt,
  onProposalDecision,
  onReviseProposal,
}: Props) => {
  const monacoLanguage = useMemo(() => normalizeEditorLanguage(editorLanguage), [editorLanguage]);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [attempts, proposals, loading]);

  return (
    <Card title="Copilot Chat" className="h-full">
      <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 640, maxHeight: "calc(100vh - 180px)" }}>
        <div style={{ flex: 1, overflow: "auto", paddingRight: 4 }}>
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            {attempts.map((attempt, index) => (
              <Card
                key={`attempt-${index}`}
                size="small"
                title={`Message ${index + 1}`}
                extra={
                  <Button size="small" type={attempt.accepted ? "primary" : "default"} onClick={() => onAcceptPromptAttempt(index)}>
                    {attempt.accepted ? "Applied" : "Use response"}
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

            {proposals.map((proposal) => (
              <Card
                key={proposal.id}
                size="small"
                title={proposal.title}
                extra={proposal.isHallucination ? <Typography.Text type="secondary">Scope-risk</Typography.Text> : null}
              >
                <Typography.Paragraph>{proposal.description}</Typography.Paragraph>
                {proposal.targetPath ? <Typography.Text type="secondary">Target file: {proposal.targetPath}</Typography.Text> : null}
                <Typography.Text type="secondary">Suggested diff ({currentFilePath || "active file"})</Typography.Text>
                <DiffEditor
                  height="220px"
                  original={currentCode || "// Current file is empty"}
                  modified={applyProposalPatch(currentCode, proposal)}
                  language={monacoLanguage}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    renderSideBySide: true,
                    minimap: { enabled: false },
                    wordWrap: "on",
                    lineNumbersMinChars: 3,
                    scrollBeyondLastLine: false,
                  }}
                />
                <Space style={{ marginTop: 8 }}>
                  <Button size="small" type={proposal.status === "accepted" ? "primary" : "default"} onClick={() => onProposalDecision(proposal.id, "accepted")}>
                    Accept change
                  </Button>
                  <Button size="small" danger={proposal.status === "declined"} onClick={() => onProposalDecision(proposal.id, "declined")}>
                    Reject change
                  </Button>
                  <Button size="small" onClick={() => onReviseProposal(proposal.id)}>
                    Revise
                  </Button>
                </Space>
              </Card>
            ))}
            <div ref={messageEndRef} />
          </Space>
        </div>

        <div style={{ borderTop: "1px solid var(--ant-colorBorderSecondary)", paddingTop: 10 }}>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Input.TextArea
              rows={3}
              placeholder="Ask AI for implementation help, trade-offs, or testing strategy..."
              value={promptInput}
              onChange={(event) => onPromptInput(event.target.value)}
              onPressEnter={(event) => {
                if (!event.shiftKey) {
                  event.preventDefault();
                  onAskAi();
                }
              }}
            />
            <Button icon={<Bot size={14} />} loading={loading} onClick={onAskAi}>
              Ask AI
            </Button>
          </Space>
        </div>
      </div>
    </Card>
  );
};
