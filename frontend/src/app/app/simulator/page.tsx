"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Clock,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Plus,
  Send,
  StopCircle,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { toast } from "@/components/providers";
import {
  useSimulationAction,
  useSimulationState,
} from "@/providers/simulation-provider";
import { useDeveloperAction, useDeveloperState } from "@/providers";
import { SimulationFeedback } from "./SimulationFeedback";
import { useStyles } from "./style";

interface ICompletedFeedback {
  scenarioTitle: string;
  completedAt: string;
  feedback: {
    communicationScore: number;
    empathyScore: number;
    resolutionScore: number;
    overallScore: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    tips: string[];
    generatedByAi: boolean;
  };
}

interface IOptimisticUserMessage {
  id: string;
  role: "User";
  content: string;
  createdAt: string;
}

interface ICallParticipant {
  id: string;
  name: string;
  role: string;
  isUser: boolean;
  avatarVariant: number;
}

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

const normalizeRoleKey = (role: string) => {
  const normalizedRole = role.toLowerCase();
  if (normalizedRole.includes("user")) {
    return "user";
  }
  if (normalizedRole.includes("facilitator")) {
    return "facilitatorbot";
  }
  if (normalizedRole.includes("stakeholder")) {
    return "stakeholderbot";
  }
  if (normalizedRole.includes("member") || normalizedRole.includes("teammate")) {
    return "memberbot";
  }
  if (normalizedRole.includes("assessor")) {
    return "assessorbot";
  }
  if (normalizedRole.includes("orchestrator")) {
    return "orchestratorbot";
  }
  return normalizedRole;
};

const getSenderLabel = (role: string) => {
  const normalizedRole = normalizeRoleKey(role);
  if (normalizedRole === "user") {
    return "You";
  }
  if (normalizedRole === "facilitatorbot") {
    return "Facilitator Bot";
  }
  if (normalizedRole === "stakeholderbot") {
    return "Stakeholder Bot";
  }
  if (normalizedRole === "memberbot") {
    return "Teammate Bot";
  }
  if (normalizedRole === "assessorbot" || normalizedRole === "assessor") {
    return "Assessor Bot";
  }
  if (normalizedRole === "orchestratorbot" || normalizedRole === "orchestrator") {
    return "Orchestrator Bot";
  }
  return "Teammate Bot";
};

const hashToVariant = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash) % 6;
};

const extractPersonaName = (personalityPrompt: string, role: string) => {
  const prompt = personalityPrompt?.trim() ?? "";
  if (!prompt) {
    return getSenderLabel(role);
  }

  const nameFromLabel = prompt.match(
    /\b(?:name|persona|character)\s*[:=-]\s*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})/,
  );
  if (nameFromLabel?.[1]) {
    return nameFromLabel[1];
  }

  const leadingName = prompt.match(
    /^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})\s+(?:is|acts|speaks|tends)\b/,
  );
  if (leadingName?.[1]) {
    return leadingName[1];
  }

  const quotedName = prompt.match(/["“]([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})["”]/);
  if (quotedName?.[1]) {
    return quotedName[1];
  }

  return getSenderLabel(role);
};

const getParticipantIdFromRole = (role: string) => {
  const normalizedRole = normalizeRoleKey(role);
  if (normalizedRole === "user") {
    return "user";
  }
  return normalizedRole;
};

const isVisibleParticipantRole = (role: string) => {
  const normalizedRole = getParticipantIdFromRole(role);
  return normalizedRole !== "assessorbot" && normalizedRole !== "assessor";
};

export default function SimulatorPage() {
  const { styles } = useStyles();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<ISpeechRecognitionEventTarget | null>(null);
  const currentReplyAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedReplyMessageIdRef = useRef<string>("");
  const botAudioPlaybackRef = useRef(false);
  const echoGuardUntilRef = useRef(0);
  const activeSpeakerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const activeTurnStartedAtRef = useRef<number | null>(null);
  const spokenMessageRef = useRef<string>("");
  const autoRestartListeningRef = useRef(false);
  const [form] = Form.useForm();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isContributing, setIsContributing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [optimisticUserMessages, setOptimisticUserMessages] = useState<
    IOptimisticUserMessage[]
  >([]);
  const [feedbackView, setFeedbackView] = useState<ICompletedFeedback | null>(
    null,
  );
  const [completedSimulations, setCompletedSimulations] = useState<
    ICompletedFeedback[]
  >([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>();
  const [isCallMode, setIsCallMode] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isPureVoiceMode, setIsPureVoiceMode] = useState(true);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>("");
  const [voiceLatencies, setVoiceLatencies] = useState<number[]>([]);
  const [isUserTalking, setIsUserTalking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isAiTurnActive, setIsAiTurnActive] = useState(false);

  const { scenarios, activeSession } = useSimulationState();
  const { currentUser } = useDeveloperState();
  const {
    fetchScenarios,
    createScenario,
    startSession,
    sendMessage,
    sendVoiceTurn,
    connectRealtime,
    disconnectRealtime,
    sendRealtimeMessage,
    interruptRealtime,
    advanceSession,
    evaluateSession,
  } = useSimulationAction();
  const { fetchCurrentUser } = useDeveloperAction();

  useEffect(() => {
    void fetchScenarios();
    void fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentSession =
    activeSession?.id === activeSessionId ? activeSession : null;

  useEffect(() => {
    if (!selectedScenarioId && scenarios.length > 0) {
      setSelectedScenarioId(scenarios[0].id);
    }
  }, [scenarios, selectedScenarioId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, optimisticUserMessages]);

  useEffect(() => {
    if (!currentSession?.id) {
      return;
    }

    void connectRealtime(currentSession.id, (event) => {
      if (event.type === "turn_started") {
        activeTurnStartedAtRef.current = performance.now();
        setIsSending(true);
        setIsAiThinking(true);
        setIsAiTurnActive(true);
        if (isVoiceListening) {
          autoRestartListeningRef.current = false;
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
          setIsVoiceListening(false);
          setIsUserTalking(false);
          setMessage("");
        }
      }

      if (event.type === "bot_text") {
        const role = String(event.payload?.role ?? "");
        setIsAiThinking(false);
        if (role) {
          announceActiveSpeaker(role);
        }
      }

      if (event.type === "bot_audio") {
        const messageId = String(event.payload?.messageId ?? "");
        const role = String(event.payload?.role ?? "");
        const audioBase64 = String(event.payload?.audioBase64 ?? "");
        const audioMimeType = String(event.payload?.audioMimeType ?? "audio/mpeg");
        if (audioBase64) {
          const alreadyPlayed = messageId && messageId === lastPlayedReplyMessageIdRef.current;
          if (!alreadyPlayed) {
            const source = `data:${audioMimeType};base64,${audioBase64}`;
            const audio = new Audio(source);
            audio.playbackRate = getPlaybackRateForRole(role);
            currentReplyAudioRef.current = audio;
            botAudioPlaybackRef.current = true;
            echoGuardUntilRef.current = Date.now() + 1200;
            if (messageId) {
              lastPlayedReplyMessageIdRef.current = messageId;
            }
            audio.onended = () => {
              botAudioPlaybackRef.current = false;
              echoGuardUntilRef.current = Date.now() + 1200;
              if (currentReplyAudioRef.current === audio) {
                currentReplyAudioRef.current = null;
              }
            };
            audio.play().catch(() => undefined);
          }
        }
      }

      if (event.type === "turn_completed") {
        if (activeTurnStartedAtRef.current) {
          appendLatency(performance.now() - activeTurnStartedAtRef.current);
          activeTurnStartedAtRef.current = null;
        }
        setIsAiThinking(false);
        setIsAiTurnActive(false);
        setIsSending(false);
        setOptimisticUserMessages([]);
      }

      if (event.type === "error") {
        const message = String(event.payload?.message ?? "Realtime simulation failed.");
        toast.error("Realtime error", message);
        setIsAiThinking(false);
        setIsAiTurnActive(false);
        setIsSending(false);
      }
    });

    return () => {
      void disconnectRealtime();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession?.id]);

  useEffect(() => {
    return () => {
      autoRestartListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (currentReplyAudioRef.current) {
        currentReplyAudioRef.current.pause();
        currentReplyAudioRef.current.currentTime = 0;
      }
      if (activeSpeakerTimeoutRef.current) {
        clearTimeout(activeSpeakerTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      !currentSession?.id ||
      currentSession.sessionType !== "MeetingSimulation" ||
      currentSession.awaitingUserInput ||
      isSending
    ) {
      return;
    }

    const timer = setTimeout(() => {
      const startedAt = performance.now();
      void advanceSession(currentSession.id).then(() => {
        const latency = performance.now() - startedAt;
        setVoiceLatencies((prev) => [...prev, latency].slice(-25));
      });
    }, 250);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentSession?.id,
    currentSession?.sessionType,
    currentSession?.awaitingUserInput,
    currentSession?.messages.length,
    isSending,
  ]);

  const selectedScenario = useMemo(
    () => scenarios.find((item) => item.id === selectedScenarioId),
    [scenarios, selectedScenarioId],
  );

  const renderedMessages = useMemo(() => {
    if (!currentSession) {
      return [];
    }

    return [...currentSession.messages, ...optimisticUserMessages];
  }, [currentSession, optimisticUserMessages]);

  const userDisplayName = useMemo(() => {
    const full = `${currentUser?.name ?? ""} ${currentUser?.surname ?? ""}`.trim();
    return full || "You";
  }, [currentUser?.name, currentUser?.surname]);

  const participants = useMemo<ICallParticipant[]>(() => {
    if (!currentSession) {
      return [];
    }

    const mappedBots = currentSession.bots
      .filter((bot) => isVisibleParticipantRole(bot.role))
      .map((bot, index) => {
      const botId = bot.id || `${bot.role}-${index}`;
      return {
        id: botId,
        name: extractPersonaName(bot.personalityPrompt, bot.role),
        role: getParticipantIdFromRole(bot.role),
        isUser: false,
        avatarVariant: hashToVariant(botId),
      };
      });

    return [
      {
        id: "user",
        name: userDisplayName,
        role: "user",
        isUser: true,
        avatarVariant: hashToVariant("user"),
      },
      ...mappedBots,
    ];
  }, [currentSession, userDisplayName]);

  const personaLabelByRole = useMemo(() => {
    const map = new Map<string, string>();
    participants.forEach((participant) => {
      if (!participant.isUser && !map.has(participant.role)) {
        map.set(participant.role, participant.name);
      }
    });
    return map;
  }, [participants]);

  const activeSpeakerParticipantId = useMemo(() => {
    if (!activeSpeakerId) {
      return "";
    }
    return (
      participants.find(
        (participant) => participant.role === getParticipantIdFromRole(activeSpeakerId),
      )?.id ?? ""
    );
  }, [activeSpeakerId, participants]);

  const averageLatency = (values: number[]) => {
    if (!values.length) {
      return null;
    }
    const total = values.reduce((sum, value) => sum + value, 0);
    return Math.round(total / values.length);
  };

  const voiceLatencyAvg = useMemo(
    () => averageLatency(voiceLatencies),
    [voiceLatencies],
  );

  const appendLatency = (latencyMs: number) => {
    setVoiceLatencies((prev) => [...prev, latencyMs].slice(-25));
  };

  const getParticipantByRole = (role: string) => {
    const normalizedRole = getParticipantIdFromRole(role);
    return participants.find((participant) => participant.role === normalizedRole);
  };

  const getSpeakerName = (role: string) => {
    const normalizedRole = getParticipantIdFromRole(role);
    return personaLabelByRole.get(normalizedRole) ?? getSenderLabel(role);
  };

  const getAvatarVariantClass = (variant: number) => {
    if (variant === 1) return styles.avatarVariant1;
    if (variant === 2) return styles.avatarVariant2;
    if (variant === 3) return styles.avatarVariant3;
    if (variant === 4) return styles.avatarVariant4;
    if (variant === 5) return styles.avatarVariant5;
    return styles.avatarVariant0;
  };

  const announceActiveSpeaker = (speakerRoleOrId: string) => {
    setActiveSpeakerId(getParticipantIdFromRole(speakerRoleOrId));
    if (activeSpeakerTimeoutRef.current) {
      clearTimeout(activeSpeakerTimeoutRef.current);
    }
    activeSpeakerTimeoutRef.current = setTimeout(() => {
      setActiveSpeakerId("");
    }, 3200);
  };

  const stopCurrentReplyAudio = () => {
    if (!currentReplyAudioRef.current) {
      return;
    }
    currentReplyAudioRef.current.pause();
    currentReplyAudioRef.current.currentTime = 0;
    currentReplyAudioRef.current = null;
    botAudioPlaybackRef.current = false;
    echoGuardUntilRef.current = Date.now() + 1200;
    setActiveSpeakerId("");
  };

  const getPlaybackRateForRole = (role: string) => {
    const normalizedRole = getParticipantIdFromRole(role);
    if (normalizedRole === "facilitatorbot") return 1.0;
    if (normalizedRole === "stakeholderbot") return 0.95;
    if (normalizedRole === "memberbot") return 1.05;
    if (normalizedRole === "assessorbot") return 0.9;
    if (normalizedRole === "orchestratorbot") return 0.98;
    return 1.0;
  };

  const primaryBotRole = useMemo(() => {
    const primaryParticipant = participants.find((participant) => !participant.isUser);
    if (!primaryParticipant) {
      return "";
    }
    return primaryParticipant.role;
  }, [participants]);


  useEffect(() => {
    const latestMessage = renderedMessages[renderedMessages.length - 1];
    if (!latestMessage) {
      return;
    }

    const speakerRole = getParticipantIdFromRole(latestMessage.role);
    announceActiveSpeaker(speakerRole);
  }, [renderedMessages]);

  const handleStartSimulation = async (scenarioId: string) => {
    setIsStarting(true);
    try {
      const session = await startSession({ scenarioId });
      if (session?.id) {
        setActiveSessionId(session.id);
        setOptimisticUserMessages([]);
        setFeedbackView(null);
        setIsCallMode(false);
        setVoiceLatencies([]);
        toast.success("Simulation started!", "Session is ready.");
      }
    } catch (error) {
      toast.error(
        "Start failed",
        error instanceof Error ? error.message : "Failed to start simulation.",
      );
    } finally {
      setIsStarting(false);
    }
  };

  const canSendNow = () => {
    if (!currentSession?.id || isSending) {
      return false;
    }
    if (
      currentSession.sessionType === "MeetingSimulation" &&
      !currentSession.awaitingUserInput
    ) {
      return false;
    }
    return true;
  };

  const sendUserMessage = async (rawContent: string) => {
    const userMessage = rawContent.trim();
    if (!userMessage || !canSendNow() || !currentSession?.id) {
      return;
    }

    const optimisticMessage: IOptimisticUserMessage = {
      id: `optimistic-${Date.now()}`,
      role: "User",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    announceActiveSpeaker("user");
    stopCurrentReplyAudio();
    void interruptRealtime();
    setIsUserTalking(false);
    setMessage("");
    setOptimisticUserMessages((prev) => [...prev, optimisticMessage]);
    try {
      await sendRealtimeMessage(currentSession.id, userMessage);
    } catch (error) {
      try {
        const voiceResult = await sendVoiceTurn(currentSession.id, userMessage);
        if (voiceResult?.replyRole) {
          announceActiveSpeaker(voiceResult.replyRole);
        }
        if (voiceResult?.audioBase64) {
          const isAlreadyPlayed =
            Boolean(voiceResult.replyMessageId) &&
            voiceResult.replyMessageId === lastPlayedReplyMessageIdRef.current;
          if (!isAlreadyPlayed) {
            const source = `data:${voiceResult.audioMimeType ?? "audio/mpeg"};base64,${voiceResult.audioBase64}`;
            const audio = new Audio(source);
            audio.playbackRate = getPlaybackRateForRole(voiceResult.replyRole ?? "");
            currentReplyAudioRef.current = audio;
            if (voiceResult.replyMessageId) {
              lastPlayedReplyMessageIdRef.current = voiceResult.replyMessageId;
            }
            audio.onended = () => {
              if (currentReplyAudioRef.current === audio) {
                currentReplyAudioRef.current = null;
              }
            };
            audio.play().catch(() => undefined);
          }
        }
        setOptimisticUserMessages([]);
      } catch (fallbackError) {
        setOptimisticUserMessages((prev) =>
          prev.filter((item) => item.id !== optimisticMessage.id),
        );
        setMessage(userMessage);
        toast.error(
          "Failed to send message",
          fallbackError instanceof Error ? fallbackError.message : "Try again.",
        );
      }
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      return;
    }
    const currentMessage = message;
    setMessage("");
    await sendUserMessage(currentMessage);
  };

  const startVoiceListening = () => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechApi =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechApi) {
      toast.error("Voice unavailable", "Speech recognition is not supported.");
      return;
    }

    const recognition = new SpeechApi();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      if (botAudioPlaybackRef.current || Date.now() < echoGuardUntilRef.current || isAiTurnActive) {
        return;
      }

      const results = Array.from(event.results).slice(event.resultIndex);
      const interimTranscript = results
        .filter((entry) => !entry.isFinal)
        .map((entry) => entry[0]?.transcript ?? "")
        .join(" ")
        .trim();

      if (interimTranscript) {
        stopCurrentReplyAudio();
        announceActiveSpeaker("user");
        setIsUserTalking(true);
        setMessage(interimTranscript);
      }

      const finalTranscript = results
        .filter((entry) => entry.isFinal)
        .map((entry) => entry[0]?.transcript ?? "")
        .join(" ")
        .trim();

      if (finalTranscript) {
        setIsUserTalking(false);
        setMessage("");
        void sendUserMessage(finalTranscript);
      }
    };
    recognition.onerror = () => {
      setIsVoiceListening(false);
      setIsUserTalking(false);
      toast.error("Voice input failed", "Please try again.");
    };
    recognition.onend = () => {
      setIsVoiceListening(false);
      setIsUserTalking(false);
      recognitionRef.current = null;
      if (autoRestartListeningRef.current) {
        setTimeout(() => {
          startVoiceListening();
        }, 200);
      }
    };

    recognitionRef.current = recognition;
    setIsVoiceListening(true);
    recognition.start();
  };

  const stopVoiceListening = () => {
    autoRestartListeningRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsVoiceListening(false);
  };

  const toggleVoiceListening = () => {
    if (isVoiceListening) {
      stopVoiceListening();
      return;
    }
    autoRestartListeningRef.current = true;
    startVoiceListening();
  };

  const handleEndSimulation = async () => {
    if (!currentSession || currentSession.messages.length < 4) return;
    setIsEnding(true);
    try {
      const feedback = await evaluateSession(currentSession.id);
      if (!feedback?.generatedByAi) {
        throw new Error("AI evaluation is unavailable. Please try again.");
      }

      const completedFeedback: ICompletedFeedback = {
        scenarioTitle: currentSession.scenarioTitle,
        completedAt: new Date().toISOString(),
        feedback,
      };
      setFeedbackView(completedFeedback);
      setCompletedSimulations((prev) => [completedFeedback, ...prev].slice(0, 8));
      setActiveSessionId(null);
      toast.success("Simulation complete!", "AI feedback is ready.");
    } catch (error) {
      toast.error(
        "Simulation evaluation failed",
        error instanceof Error ? error.message : "Unable to evaluate this session.",
      );
    } finally {
      setIsEnding(false);
    }
  };

  useEffect(() => {
    if (!currentSession?.id || !isPureVoiceMode || isAiTurnActive) {
      if (isVoiceListening) {
        stopVoiceListening();
      }
      return;
    }

    if (!isVoiceListening) {
      autoRestartListeningRef.current = true;
      startVoiceListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession?.id, isPureVoiceMode, isAiTurnActive]);

  if (feedbackView) {
    return (
      <SimulationFeedback
        scenarioTitle={feedbackView.scenarioTitle}
        feedback={feedbackView.feedback}
        onReset={() => setFeedbackView(null)}
      />
    );
  }

  if (currentSession) {
    return (
      <div className={styles.activeWrap} data-ai-page="simulator-session">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className={styles.activeHeader}
        >
          <div>
            <Typography.Title level={3} className={styles.activeTitle}>
              <Brain size={18} />
              {currentSession.scenarioTitle}
            </Typography.Title>
            <Typography.Paragraph className={styles.subtitle}>
              Practice handling this workplace scenario.
            </Typography.Paragraph>
          </div>
          <div className={styles.actionRow}>
            <Tag>{renderedMessages.length} messages</Tag>
            <Tag>Voice: Native</Tag>
            <Tag color={isVoiceListening ? "green" : "default"}>
              {isVoiceListening ? "Listening" : "Mic Paused"}
            </Tag>
            {currentSession.sessionType === "MeetingSimulation" ? (
              <Tag color={currentSession.awaitingUserInput ? "gold" : "blue"}>
                {currentSession.awaitingUserInput
                  ? "Your turn"
                  : "Team discussing"}
              </Tag>
            ) : null}
            <div className={styles.toggleWrap}>
              <Space size="small">
                <Mic size={14} />
                <Switch
                  checked={isPureVoiceMode}
                  onChange={setIsPureVoiceMode}
                />
                <Typography.Text>Pure Voice</Typography.Text>
              </Space>
            </div>
            <div className={styles.toggleWrap}>
              <Space size="small">
                <MessageSquare size={14} />
                <Switch
                  checked={isCallMode}
                  onChange={setIsCallMode}
                  checkedChildren={<LayoutGrid size={12} />}
                  unCheckedChildren={<MessageSquare size={12} />}
                />
                <LayoutGrid size={14} />
              </Space>
            </div>
            <Button
              type="primary"
              onClick={() => void handleEndSimulation()}
              disabled={currentSession.messages.length < 4 || isEnding}
              loading={isEnding}
              icon={<StopCircle size={14} />}
              data-ai-action="end-simulation"
            >
              End Simulation
            </Button>
          </div>
        </motion.div>

        <Card className={styles.chatCard}>
          {isCallMode ? (
            <div className={styles.callModeContainer}>
              <div className={styles.comparisonPanel}>
                <span>Avg latency</span>
                <span>{voiceLatencyAvg ? `${voiceLatencyAvg}ms` : "--"}</span>
              </div>
              <div className={styles.callGrid}>
                {participants.map((participant) => {
                  const isSpeaking = activeSpeakerParticipantId === participant.id || (participant.isUser && isUserTalking);
                  const isThinking = !participant.isUser && isAiThinking && participant.role === primaryBotRole;
                  const avatarLabel = participant.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <div
                      key={`${participant.id}-${participant.role}`}
                      className={`${styles.participantCard} ${isSpeaking ? styles.participantSpeaking : ""}`}
                    >
                      <Avatar
                        className={`${styles.participantAvatar} ${getAvatarVariantClass(participant.avatarVariant)}`}
                      >
                        {avatarLabel}
                      </Avatar>
                      <Typography.Text strong>{participant.name}</Typography.Text>
                      <Typography.Text type="secondary" className={styles.participantRole}>
                        {participant.isUser ? "You" : participant.name}
                      </Typography.Text>
                      {isThinking ? (
                        <Tag color="blue" className={styles.speakingTag}>
                          Thinking...
                        </Tag>
                      ) : null}
                      {participant.isUser && isAiTurnActive ? (
                        <Tag className={styles.mutedTag}>
                          Muted
                        </Tag>
                      ) : null}
                      {isSpeaking ? (
                        <Tag color="gold" className={styles.speakingTag}>
                          Speaking
                        </Tag>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          {!isCallMode ? (
          <div className={styles.messagePane}>
            {renderedMessages.map((msg, index) => {
              const isUser = msg.role.toLowerCase() === "user";
              const senderLabel = isUser ? userDisplayName : getSpeakerName(msg.role);
              const avatarVariant =
                getParticipantByRole(msg.role)?.avatarVariant ??
                hashToVariant(msg.role);
              return (
                <motion.div
                  key={msg.id}
                  className={`${styles.bubbleRow} ${isUser ? styles.bubbleRowUser : ""}`}
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  {!isUser ? (
                    <div
                      className={`${styles.avatar} ${getAvatarVariantClass(avatarVariant)}`}
                    >
                      <Brain size={14} />
                    </div>
                  ) : null}
                  <div
                    className={`${styles.bubble} ${isUser ? styles.userBubble : ""}`}
                  >
                    <p className={styles.bubbleText}>{msg.content}</p>
                    <p className={styles.bubbleMeta}>
                      {senderLabel} · {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  {isUser ? (
                    <div className={`${styles.avatar} ${styles.userAvatar}`}>
                      You
                    </div>
                  ) : null}
                </motion.div>
              );
            })}

            {isSending ? (
              <div className={styles.bubbleRow}>
                <div className={styles.avatar}>
                  <Brain size={14} />
                </div>
                <div className={styles.bubble}>
                  <div className={styles.typingRow}>
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                  </div>
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
          ) : null}

          <div className={styles.composer}>
            {isPureVoiceMode ? (
              <div className={styles.composerRow}>
                <Input
                  value={message}
                  placeholder={isVoiceListening ? "Listening..." : "Voice paused"}
                  disabled
                />
                <Tooltip title={isVoiceListening ? "Pause voice input" : "Resume voice input"}>
                  <Button
                    onClick={toggleVoiceListening}
                    icon={isVoiceListening ? <MicOff size={14} /> : <Mic size={14} />}
                    data-ai-action="toggle-simulator-voice"
                  />
                </Tooltip>
              </div>
            ) : (
              <div className={styles.composerRow}>
                <Input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onPressEnter={() => void handleSend()}
                  placeholder="Type your response..."
                  disabled={
                    isSending ||
                    (currentSession.sessionType === "MeetingSimulation" &&
                      !currentSession.awaitingUserInput)
                  }
                />
                <Tooltip title={isVoiceListening ? "Stop voice input" : "Start voice input"}>
                  <Button
                    onClick={toggleVoiceListening}
                    disabled={
                      isSending ||
                      (currentSession.sessionType === "MeetingSimulation" &&
                        !currentSession.awaitingUserInput)
                    }
                    icon={isVoiceListening ? <MicOff size={14} /> : <Mic size={14} />}
                    data-ai-action="toggle-simulator-voice"
                  />
                </Tooltip>
                <Button
                  type="primary"
                  onClick={() => void handleSend()}
                  disabled={
                    !message.trim() ||
                    isSending ||
                    (currentSession.sessionType === "MeetingSimulation" &&
                      !currentSession.awaitingUserInput)
                  }
                  icon={isSending ? <Loader2 size={14} /> : <Send size={14} />}
                />
              </div>
            )}
            <p className={styles.helperText}>
              {currentSession.sessionType === "MeetingSimulation"
                ? currentSession.awaitingUserInput
                  ? isPureVoiceMode
                    ? "You're live. Speak now."
                    : "Your turn: respond to the team."
                  : "Team is discussing. Wait for your turn."
                : isPureVoiceMode
                  ? "Always listening. Speak naturally."
                  : "Send at least 3 messages before ending the simulation."}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page} data-ai-page="simulator">
      <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
        <Typography.Title level={2} className={styles.title}>
          AI Teammate Simulator
        </Typography.Title>
        <Typography.Paragraph className={styles.subtitle}>
          Practice difficult workplace scenarios in a safe environment.
        </Typography.Paragraph>
      </motion.div>

      <div>
        <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
          <Typography.Title level={4} className={styles.sectionTitle}>
            Choose a Scenario
          </Typography.Title>
          <Button
            icon={<Plus size={14} />}
            onClick={() => setIsCreateOpen(true)}
            data-ai-action="open-contribute-scenario"
          >
            Contribute Scenario
          </Button>
        </Space>
        <div className={styles.scenarioGrid}>
          {scenarios.map((scenario) => (
            <Card
              key={scenario.id}
              className={styles.scenarioCard}
              onClick={() => setSelectedScenarioId(scenario.id)}
            >
              <Typography.Title level={5}>{scenario.title}</Typography.Title>
              <Typography.Paragraph className={styles.scenarioPrompt}>
                {scenario.prompt}
              </Typography.Paragraph>
              <Button
                type={
                  selectedScenarioId === scenario.id ? "primary" : "default"
                }
                onClick={() => void handleStartSimulation(scenario.id)}
                icon={<ArrowRight size={14} />}
                loading={isStarting && selectedScenarioId === scenario.id}
                data-ai-action="start-scenario"
                data-ai-entity-id={scenario.id}
              >
                Start Scenario
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {completedSimulations.length > 0 ? (
        <div>
          <Typography.Title level={4} className={styles.sectionTitle}>
            Past Simulations
          </Typography.Title>
          <div className={styles.historyGrid}>
            {completedSimulations.slice(0, 4).map((sim) => (
              <Card key={`${sim.scenarioTitle}-${sim.completedAt}`}>
                <Typography.Text strong>{sim.scenarioTitle}</Typography.Text>
                <div className={styles.actionRow}>
                  <Clock size={12} />
                  <Typography.Text type="secondary">
                    {new Date(sim.completedAt).toLocaleDateString()}
                  </Typography.Text>
                </div>
                <Typography.Title level={3}>
                  {sim.feedback.overallScore}%
                </Typography.Title>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Empty description="No completed simulations yet." />
      )}

      {selectedScenario ? (
        <Card title="Scenario Brief">
          <Typography.Paragraph>{selectedScenario.prompt}</Typography.Paragraph>
          <Space wrap>
            {selectedScenario.requiredRoles.map((role) => (
              <Badge key={role} count={role} />
            ))}
          </Space>
        </Card>
      ) : null}

      <Modal
        title="Contribute Scenario"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            setIsContributing(true);
            const created = await createScenario(values);
            if (created?.id) {
              setSelectedScenarioId(created.id);
            }
            setIsCreateOpen(false);
            form.resetFields();
            toast.success(
              "Scenario submitted",
              "Your scenario is now available.",
            );
          } catch (error) {
            toast.error(
              "Contribution failed",
              error instanceof Error ? error.message : "Try again.",
            );
          } finally {
            setIsContributing(false);
          }
        }}
        confirmLoading={isContributing}
        okText="Submit"
        okButtonProps={{ "data-ai-action": "submit-contribute-scenario" }}
      >
        <Form
          form={form}
          layout="vertical"
          className={styles.modalGrid}
          initialValues={{ botCount: 2, requiredRoles: ["Teammate"] }}
        >
          <Form.Item label="Title" name="title" rules={[{ required: true }]}>
            <Input data-ai-field="scenario-title" />
          </Form.Item>
          <Form.Item label="Prompt" name="prompt" rules={[{ required: true }]}>
            <Input.TextArea rows={4} data-ai-field="scenario-prompt" />
          </Form.Item>
          <Form.Item
            label="Bot Count"
            name="botCount"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={8} className={styles.fullWidth} />
          </Form.Item>
          <Form.Item label="Required Roles" name="requiredRoles">
            <Select
              mode="multiple"
              options={[
                { value: "Teammate" },
                { value: "Facilitator" },
                { value: "Stakeholder" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
