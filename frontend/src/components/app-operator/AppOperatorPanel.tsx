"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Drawer, Input, Space, Switch, Typography } from "antd";
import { Bot, Mic, MicOff, Send } from "lucide-react";
import { executeOperatorIntent } from "@/lib/app-operator/executionEngine";
import { intentNeedsConfirmation } from "@/lib/app-operator/safety";
import { IAppOperatorIntent } from "@/lib/app-operator/types";
import {
  useAppOperatorAction,
  useAppOperatorState,
} from "@/providers/app-operator-provider";
import { useStyles } from "./styles";

interface ISpeechRecognitionResultEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface ISpeechRecognitionEventTarget extends EventTarget {
  onresult: ((event: ISpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => ISpeechRecognitionEventTarget;
    SpeechRecognition?: new () => ISpeechRecognitionEventTarget;
  }
}

const cx = (...values: Array<string | undefined | false>) =>
  values.filter(Boolean).join(" ");

export const AppOperatorPanel = () => {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { styles } = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<ISpeechRecognitionEventTarget | null>(null);
  const autoRestartRef = useRef(true);
  const isSubmittingRef = useRef(false);
  const state = useAppOperatorState();
  const actions = useAppOperatorAction();

  const runIntent = async (intent: IAppOperatorIntent) => {
    actions.setConfirmation(undefined);
    actions.setPending(true);

    const result = await executeOperatorIntent(intent, {
      currentPath: pathname,
      navigate: (path) => router.push(path),
    });

    if (result.narration.length > 0) {
      result.narration.forEach((line) => actions.addAssistantMessage(line));
    }

    if (!result.success && result.error) {
      actions.addAssistantMessage(result.error);
      actions.setError();
      return;
    }

    actions.setSuccess();
  };

  const processCommand = async (rawCommand: string, fromVoice: boolean) => {
    if (isSubmittingRef.current) {
      return;
    }

    const trimmed = rawCommand.trim();
    if (!trimmed) {
      return;
    }

    isSubmittingRef.current = true;
    try {
      actions.addUserMessage(fromVoice ? `[voice] ${trimmed}` : trimmed);
      if (!fromVoice) {
        setCommand("");
      }

      actions.setPending(true);
      const planning = await actions.planCommand(trimmed, pathname);
      actions.setPending(false);

      if (planning.source === "groq") {
        actions.addAssistantMessage("Planned with Groq AI.");
      }

      const intent = planning.intent;
      if (intent.missingRequired.length > 0) {
        const missing = intent.missingRequired.join(", ");
        actions.addAssistantMessage(`I need ${missing} before I can submit.`);
        actions.setError();
        return;
      }

      if (intentNeedsConfirmation(intent)) {
        const summary = `I am ready to execute "${intent.type}". Confirm to continue.`;
        actions.setConfirmation({ intent, summary });
        actions.addAssistantMessage(summary);
        return;
      }

      actions.setConfirmation(undefined);
      await runIntent(intent);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleSubmit = async () => {
    await processCommand(command, false);
  };

  const stopVoiceListening = () => {
    autoRestartRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const startVoiceListening = () => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechApi = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechApi) {
      setVoiceSupported(false);
      return;
    }

    setVoiceSupported(true);
    const recognition = new SpeechApi();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      const results = Array.from(event.results).slice(event.resultIndex);
      const finalTranscript = results
        .filter((entry) => entry.isFinal)
        .map((entry) => entry[0]?.transcript ?? "")
        .join(" ")
        .trim();

      if (finalTranscript) {
        void processCommand(finalTranscript, true);
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      if (autoRestartRef.current && voiceEnabled) {
        setTimeout(() => {
          startVoiceListening();
        }, 260);
      }
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechApi = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechApi) {
      setVoiceSupported(false);
      return;
    }

    setVoiceSupported(true);
    autoRestartRef.current = voiceEnabled;
    if (voiceEnabled && !isListening) {
      startVoiceListening();
    }
    if (!voiceEnabled && isListening) {
      stopVoiceListening();
    }

    return () => {
      autoRestartRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceEnabled]);

  const history = useMemo(() => state.history.slice(-40), [state.history]);

  return (
    <>
      <Button
        type="primary"
        shape="round"
        icon={voiceEnabled && isListening ? <Mic size={16} /> : <Bot size={16} />}
        className={styles.trigger}
        onClick={() => setIsOpen(true)}
        data-ai-action="open-app-operator"
      >
        AI Operator
      </Button>
      <Drawer
        title="MosaicTalent AI App Operator"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        size="large"
      >
        <div className={styles.drawerBody}>
          <div className={styles.statusRow}>
            <Typography.Text strong>Voice Command Mode</Typography.Text>
            <Space size="small">
              <Typography.Text className={voiceEnabled ? styles.statusOn : styles.statusOff}>
                {voiceEnabled && isListening ? "Always listening" : "Off"}
              </Typography.Text>
              <Switch
                checked={voiceEnabled}
                onChange={setVoiceEnabled}
                disabled={!voiceSupported}
                checkedChildren={<Mic size={12} />}
                unCheckedChildren={<MicOff size={12} />}
                data-ai-action="toggle-operator-voice"
              />
            </Space>
          </div>
          {!voiceSupported ? (
            <Typography.Text type="secondary">
              Speech recognition is not supported in this browser.
            </Typography.Text>
          ) : null}

          <div className={styles.history}>
            {history.length === 0 ? (
              <Typography.Text type="secondary">
                Try: "Create a new user called Simon Manga email simon@company.com password Welcome123"
              </Typography.Text>
            ) : null}
            {history.map((item) => (
              <div
                key={item.id}
                className={cx(
                  styles.message,
                  item.role === "user" ? styles.userMessage : styles.assistantMessage,
                )}
              >
                {item.text}
              </div>
            ))}
          </div>

          {state.pendingConfirmation ? (
            <div className={styles.confirmBox}>
              <Typography.Text>{state.pendingConfirmation.summary}</Typography.Text>
              <div className={styles.confirmActions}>
                <Button
                  type="primary"
                  onClick={() => void runIntent(state.pendingConfirmation!.intent)}
                  data-ai-action="operator-confirm"
                >
                  Confirm
                </Button>
                <Button
                  onClick={() => {
                    actions.setConfirmation(undefined);
                    actions.addAssistantMessage("Action cancelled.");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          <Space.Compact className={styles.footerRow}>
            <Input
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              onPressEnter={() => void handleSubmit()}
              placeholder="Type a command..."
              className={styles.input}
              data-ai-field="operator-command-input"
            />
            <Button
              type="primary"
              icon={<Send size={14} />}
              loading={state.isPending}
              onClick={() => void handleSubmit()}
              data-ai-action="operator-submit-command"
              aria-label="Send command"
            />
          </Space.Compact>
          <Button onClick={() => actions.clearHistory()} size="small">
            Clear history
          </Button>
        </div>
      </Drawer>
    </>
  );
};
