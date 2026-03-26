"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Clock,
  Loader2,
  Plus,
  Send,
  StopCircle,
} from "lucide-react";
import {
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
  Tag,
  Typography,
} from "antd";
import { toast } from "@/components/providers";
import {
  useSimulationAction,
  useSimulationState,
} from "@/providers/simulation-provider";
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

export default function SimulatorPage() {
  const { styles } = useStyles();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [form] = Form.useForm();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isContributing, setIsContributing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [feedbackView, setFeedbackView] = useState<ICompletedFeedback | null>(
    null,
  );
  const [completedSimulations, setCompletedSimulations] = useState<
    ICompletedFeedback[]
  >([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>();

  const { scenarios, activeSession } = useSimulationState();
  const {
    fetchScenarios,
    createScenario,
    startSession,
    sendMessage,
    advanceSession,
    evaluateSession,
  } = useSimulationAction();

  useEffect(() => {
    void fetchScenarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedScenarioId && scenarios.length > 0) {
      setSelectedScenarioId(scenarios[0].id);
    }
  }, [scenarios, selectedScenarioId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages]);

  const currentSession =
    activeSession?.id === activeSessionId ? activeSession : null;

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
      void advanceSession(currentSession.id);
    }, 1600);

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

  const handleStartSimulation = async (scenarioId: string) => {
    setIsStarting(true);
    try {
      const session = await startSession({ scenarioId });
      if (session?.id) {
        setActiveSessionId(session.id);
        setFeedbackView(null);
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

  const handleSend = async () => {
    if (!message.trim() || !currentSession?.id || isSending) return;
    if (
      currentSession.sessionType === "MeetingSimulation" &&
      !currentSession.awaitingUserInput
    ) {
      return;
    }
    const userMessage = message.trim();
    setMessage("");
    setIsSending(true);
    try {
      await sendMessage(currentSession.id, userMessage);
    } catch (error) {
      toast.error(
        "Failed to send message",
        error instanceof Error ? error.message : "Try again.",
      );
    } finally {
      setIsSending(false);
    }
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
      <div className={styles.activeWrap}>
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
            <Tag>{currentSession.messages.length} messages</Tag>
            {currentSession.sessionType === "MeetingSimulation" ? (
              <Tag color={currentSession.awaitingUserInput ? "gold" : "blue"}>
                {currentSession.awaitingUserInput
                  ? "Your turn"
                  : "Team discussing"}
              </Tag>
            ) : null}
            <Button
              type="primary"
              onClick={() => void handleEndSimulation()}
              disabled={currentSession.messages.length < 4 || isEnding}
              loading={isEnding}
              icon={<StopCircle size={14} />}
            >
              End Simulation
            </Button>
          </div>
        </motion.div>

        <Card className={styles.chatCard}>
          <div className={styles.messagePane}>
            {currentSession.messages.map((msg, index) => {
              const isUser = msg.role.toLowerCase() === "user";
              return (
                <motion.div
                  key={msg.id}
                  className={`${styles.bubbleRow} ${isUser ? styles.bubbleRowUser : ""}`}
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  {!isUser ? (
                    <div className={styles.avatar}>
                      <Brain size={14} />
                    </div>
                  ) : null}
                  <div
                    className={`${styles.bubble} ${isUser ? styles.userBubble : ""}`}
                  >
                    <p className={styles.bubbleText}>{msg.content}</p>
                    <p className={styles.bubbleMeta}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
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

          <div className={styles.composer}>
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
            <p className={styles.helperText}>
              {currentSession.sessionType === "MeetingSimulation"
                ? currentSession.awaitingUserInput
                  ? "Your turn: respond to the team."
                  : "Team is discussing. Wait for your turn."
                : "Send at least 3 messages before ending the simulation."}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
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
      >
        <Form
          form={form}
          layout="vertical"
          className={styles.modalGrid}
          initialValues={{ botCount: 2, requiredRoles: ["Teammate"] }}
        >
          <Form.Item label="Title" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Prompt" name="prompt" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
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
