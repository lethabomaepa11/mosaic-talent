"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Card, Drawer, Input, Space, Switch, Tag, Typography } from "antd";
import { Mic, MicOff, Send, Sparkles, WandSparkles } from "lucide-react";
import {
  AppOperatorPlanMode,
  IAppOperatorPlanStep,
} from "@/lib/app-operator/planner";
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

interface ICursorState {
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => ISpeechRecognitionEventTarget;
    SpeechRecognition?: new () => ISpeechRecognitionEventTarget;
  }
}

const cx = (...values: Array<string | undefined | false>) =>
  values.filter(Boolean).join(" ");

const toPendingSteps = (steps: IAppOperatorPlanStep[]) =>
  steps.map((step, index): IAppOperatorPlanStep => ({
    ...step,
    status: index === 0 ? "in_progress" : "pending",
  }));

const buildModeTagColor = (mode: AppOperatorPlanMode | null) => {
  if (mode === "execute") {
    return "processing";
  }
  if (mode === "guided") {
    return "warning";
  }
  if (mode === "chat") {
    return "default";
  }

  return "blue";
};

export const AppOperatorPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [guidedSteps, setGuidedSteps] = useState<IAppOperatorPlanStep[]>([]);
  const [suggestedIntent, setSuggestedIntent] = useState<IAppOperatorIntent | undefined>(
    undefined,
  );
  const [showExecutionOffer, setShowExecutionOffer] = useState(false);
  const [lastPlanMode, setLastPlanMode] = useState<AppOperatorPlanMode | null>(null);
  const [lastPlanSource, setLastPlanSource] = useState<"groq" | "fallback" | null>(null);
  const [cursor, setCursor] = useState<ICursorState>({
    visible: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    label: "",
  });

  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { styles } = useStyles();
  const state = useAppOperatorState();
  const actions = useAppOperatorAction();

  const recognitionRef = useRef<ISpeechRecognitionEventTarget | null>(null);
  const cursorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepProgressRef = useRef(0);
  const isSubmittingRef = useRef(false);

  const history = useMemo(() => state.history.slice(-40), [state.history]);

  const clearCursorTimer = () => {
    if (!cursorTimeoutRef.current) {
      return;
    }
    clearTimeout(cursorTimeoutRef.current);
    cursorTimeoutRef.current = null;
  };

  const showCursorTarget = (target: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
  }) => {
    clearCursorTimer();
    setCursor({
      visible: true,
      x: target.x,
      y: target.y,
      width: target.width,
      height: target.height,
      label: target.label,
    });

    cursorTimeoutRef.current = setTimeout(() => {
      setCursor((previous) => ({ ...previous, visible: false }));
    }, 900);
  };

  const initializeStepProgress = (steps: IAppOperatorPlanStep[]) => {
    stepProgressRef.current = 0;
    setGuidedSteps(toPendingSteps(steps));
  };

  const advanceGuidedStep = () => {
    setGuidedSteps((previous) => {
      if (previous.length === 0) {
        return previous;
      }

      const currentIndex = stepProgressRef.current;
      if (currentIndex >= previous.length) {
        return previous;
      }

      const next = previous.map((step, index) => {
        if (index < currentIndex) {
          return { ...step, status: "done" as const };
        }
        if (index === currentIndex) {
          return { ...step, status: "done" as const };
        }
        if (index === currentIndex + 1) {
          return { ...step, status: "in_progress" as const };
        }
        return step;
      });

      stepProgressRef.current = Math.min(currentIndex + 1, previous.length);
      return next;
    });
  };

  const completeGuidedSteps = () => {
    setGuidedSteps((previous) =>
      previous.map((step) => ({
        ...step,
        status: "done",
      })),
    );
  };

  const blockGuidedSteps = () => {
    setGuidedSteps((previous) => {
      let blocked = false;
      return previous.map((step) => {
        if (!blocked && (step.status === "in_progress" || step.status === "pending")) {
          blocked = true;
          return { ...step, status: "blocked" as const };
        }
        return step;
      });
    });
  };

  const runIntent = async (intent: IAppOperatorIntent, steps: IAppOperatorPlanStep[] = []) => {
    actions.setConfirmation(undefined);
    actions.setPending(true);

    if (steps.length > 0) {
      initializeStepProgress(steps);
    }

    try {
      const result = await executeOperatorIntent(intent, {
        currentPath: pathname,
        navigate: (path) => router.push(path),
        onTarget: showCursorTarget,
        onProgress: () => {
          if (steps.length > 0) {
            advanceGuidedStep();
          }
        },
      });

      if (result.narration.length > 0) {
        result.narration.forEach((line) => actions.addAssistantMessage(line));
      }

      if (!result.success && result.error) {
        actions.addAssistantMessage(result.error);
        actions.setError();
        if (steps.length > 0) {
          blockGuidedSteps();
        }
        return false;
      }

      actions.setSuccess();
      if (steps.length > 0) {
        completeGuidedSteps();
      }
      return true;
    } catch {
      actions.addAssistantMessage("I hit an unexpected issue while executing this action.");
      actions.setError();
      if (steps.length > 0) {
        blockGuidedSteps();
      }
      return false;
    }
  };

  const offerExecution = (intent: IAppOperatorIntent) => {
    setSuggestedIntent(intent);
    setShowExecutionOffer(true);
    actions.addAssistantMessage("Should I run this for you now?");
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

      setLastPlanMode(planning.mode);
      setLastPlanSource(planning.source);

      if (planning.mode === "chat" || planning.mode === "guided") {
        if (planning.assistantReply) {
          actions.addAssistantMessage(planning.assistantReply);
        }

        setGuidedSteps(
          planning.steps.map((step) => ({
            ...step,
            status: "pending",
          })),
        );

        if (planning.shouldOfferExecution) {
          offerExecution(planning.intent);
        } else {
          setShowExecutionOffer(false);
          setSuggestedIntent(undefined);
        }
        return;
      }

      setShowExecutionOffer(false);
      setSuggestedIntent(undefined);
      if (planning.assistantReply) {
        actions.addAssistantMessage(planning.assistantReply);
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
        actions.setConfirmation({ intent, summary, steps: planning.steps });
        actions.addAssistantMessage(summary);
        return;
      }

      await runIntent(intent, planning.steps);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleSubmit = async () => {
    await processCommand(command, false);
  };

  const stopVoiceListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const startVoiceListening = () => {
    if (typeof window === "undefined" || !voiceEnabled) {
      return;
    }

    const SpeechApi = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechApi) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechApi();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
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
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const runSuggestedIntent = async () => {
    if (!suggestedIntent) {
      return;
    }

    if (suggestedIntent.missingRequired.length > 0) {
      const missing = suggestedIntent.missingRequired.join(", ");
      actions.addAssistantMessage(`I need ${missing} before I can submit.`);
      actions.setError();
      return;
    }

    if (intentNeedsConfirmation(suggestedIntent)) {
      const summary = `I am ready to execute "${suggestedIntent.type}". Confirm to continue.`;
      actions.setConfirmation({ intent: suggestedIntent, summary, steps: guidedSteps });
      actions.addAssistantMessage(summary);
      return;
    }

    setShowExecutionOffer(false);
    await runIntent(suggestedIntent, guidedSteps);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechApi = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setVoiceSupported(Boolean(SpeechApi));

    return () => {
      stopVoiceListening();
      clearCursorTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!voiceEnabled && isListening) {
      stopVoiceListening();
    }
  }, [voiceEnabled, isListening]);

  return (
    <>
      {cursor.visible ? (
        <>
          <div
            className={styles.cursorHalo}
            style={{
              left: cursor.x - cursor.width / 2 - 6,
              top: cursor.y - cursor.height / 2 - 6,
              width: cursor.width + 12,
              height: cursor.height + 12,
            }}
          />
          <div
            className={styles.cursorDot}
            style={{
              left: cursor.x - 8,
              top: cursor.y - 8,
            }}
          />
          {cursor.label ? (
            <div
              className={styles.cursorLabel}
              style={{
                left: cursor.x + 12,
                top: cursor.y + 12,
              }}
            >
              {cursor.label}
            </div>
          ) : null}
        </>
      ) : null}

      <Button
        type="primary"
        shape="round"
        icon={<Sparkles size={16} />}
        className={styles.trigger}
        onClick={() => setIsOpen(true)}
        data-ai-action="open-app-operator"
      >
        Ask Moahi
      </Button>
      <Drawer
        title="Ask Moahi"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        size="large"
      >
        <div className={styles.drawerBody}>
          <div className={styles.metaRow}>
            <Tag color="blue">Ask Moahi</Tag>
            {lastPlanMode ? (
              <Tag color={buildModeTagColor(lastPlanMode)}>
                {lastPlanMode.toUpperCase()}
              </Tag>
            ) : null}
            {lastPlanSource ? (
              <Tag color={lastPlanSource === "groq" ? "geekblue" : "default"}>
                {lastPlanSource === "groq" ? "GROQ PLAN" : "FALLBACK PLAN"}
              </Tag>
            ) : null}
          </div>

          <div className={styles.statusRow}>
            <Typography.Text strong>Voice Input</Typography.Text>
            <Space size="small">
              <Typography.Text className={voiceEnabled ? styles.statusOn : styles.statusOff}>
                {isListening ? "Listening" : voiceEnabled ? "Ready" : "Off"}
              </Typography.Text>
              <Switch
                checked={voiceEnabled}
                onChange={setVoiceEnabled}
                disabled={!voiceSupported}
                checkedChildren={<Mic size={12} />}
                unCheckedChildren={<MicOff size={12} />}
                data-ai-action="toggle-operator-voice"
              />
              <Button
                size="small"
                type={isListening ? "default" : "primary"}
                onClick={isListening ? stopVoiceListening : startVoiceListening}
                disabled={!voiceSupported || !voiceEnabled}
                icon={isListening ? <MicOff size={14} /> : <Mic size={14} />}
              >
                {isListening ? "Stop" : "Listen"}
              </Button>
            </Space>
          </div>
          {!voiceSupported ? (
            <Typography.Text type="secondary">
              Speech recognition is not supported in this browser.
            </Typography.Text>
          ) : null}

          {guidedSteps.length > 0 ? (
            <Card
              size="small"
              title="Step-by-step walkthrough"
              className={styles.guidedCard}
            >
              <div className={styles.stepsList}>
                {guidedSteps.map((step, index) => (
                  <div key={step.id} className={styles.stepRow}>
                    <Typography.Text className={styles.stepIndex}>
                      {index + 1}.
                    </Typography.Text>
                    <Typography.Text className={styles.stepTitle}>
                      {step.title}
                    </Typography.Text>
                    <Tag
                      color={
                        step.status === "done"
                          ? "success"
                          : step.status === "in_progress"
                            ? "processing"
                            : step.status === "blocked"
                              ? "error"
                              : "default"
                      }
                    >
                      {step.status.replace("_", " ")}
                    </Tag>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {showExecutionOffer && suggestedIntent ? (
            <div className={styles.executionOffer}>
              <Typography.Text>
                I can execute this workflow for you now.
              </Typography.Text>
              <div className={styles.executionOfferActions}>
                <Button
                  type="primary"
                  icon={<WandSparkles size={14} />}
                  onClick={() => void runSuggestedIntent()}
                  data-ai-action="operator-run-suggested"
                >
                  Run it now
                </Button>
                <Button
                  onClick={() => {
                    setShowExecutionOffer(false);
                    setSuggestedIntent(undefined);
                    actions.addAssistantMessage("No problem. I will stay in guidance mode.");
                  }}
                >
                  Not now
                </Button>
              </div>
            </div>
          ) : null}

          <div className={styles.history}>
            {history.length === 0 ? (
              <Typography.Text type="secondary">
                Try: &quot;How do I create a frontend engineer job?&quot; or
                &nbsp;&quot;Create a frontend engineer job with React and
                TypeScript.&quot;
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
                  onClick={() =>
                    void runIntent(
                      state.pendingConfirmation!.intent,
                      state.pendingConfirmation!.steps ?? [],
                    )
                  }
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
              placeholder="Ask Moahi to do something..."
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
