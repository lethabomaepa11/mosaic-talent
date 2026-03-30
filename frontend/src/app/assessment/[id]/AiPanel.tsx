"use client";

import { useEffect, useMemo, useRef } from "react";
import { DiffEditor } from "@monaco-editor/react";
import { Button, Input, Space, Typography } from "antd";
import { SendHorizontal } from "lucide-react";
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
  styles: Record<string, string>;
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
  styles,
}: Props) => {
  const monacoLanguage = useMemo(() => normalizeEditorLanguage(editorLanguage), [editorLanguage]);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [attempts, proposals, loading]);

  return (
    <div className={styles.copilotPanel}>
      <div className={styles.panelHeader}>
        <Typography.Text strong>Copilot Chat</Typography.Text>
      </div>
      <div className={styles.copilotBody}>
        <div className={styles.copilotMessages}>
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            {attempts.map((attempt, index) => (
              <div key={`attempt-${index}`} className={styles.chatItem}>
                <div className={styles.chatItemHeader}>
                  <Typography.Text strong>{`Message ${index + 1}`}</Typography.Text>
                  <Button size="small" type={attempt.accepted ? "primary" : "default"} onClick={() => onAcceptPromptAttempt(index)}>
                    {attempt.accepted ? "Applied" : "Use response"}
                  </Button>
                </div>
                <Typography.Paragraph>
                  <Typography.Text strong>You:</Typography.Text> {attempt.prompt}
                </Typography.Paragraph>
                <Typography.Paragraph style={{ marginBottom: 0 }}>
                  <Typography.Text strong>AI:</Typography.Text> {attempt.response}
                </Typography.Paragraph>
              </div>
            ))}

            {proposals.map((proposal) => (
              <div key={proposal.id} className={styles.chatItem}>
                <div className={styles.chatItemHeader}>
                  <Typography.Text strong>{proposal.title}</Typography.Text>
                  {proposal.isHallucination ? <Typography.Text type="secondary">Scope-risk</Typography.Text> : null}
                </div>
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
              </div>
            ))}
            <div ref={messageEndRef} />
          </Space>
        </div>

        <div className={styles.copilotComposer}>
          <Space size={8} style={{ width: "100%" }} align="end">
            <Input.TextArea
              rows={3}
              className={styles.copilotInput}
              placeholder="Message Copilot. Enter to send, Shift+Enter for newline."
              value={promptInput}
              onChange={(event) => onPromptInput(event.target.value)}
              onPressEnter={(event) => {
                if (!event.shiftKey) {
                  event.preventDefault();
                  onAskAi();
                }
              }}
            />
            <Button type="primary" className={styles.sendButton} icon={<SendHorizontal size={14} />} loading={loading} onClick={onAskAi} />
          </Space>
        </div>
      </div>
    </div>
  );
};
