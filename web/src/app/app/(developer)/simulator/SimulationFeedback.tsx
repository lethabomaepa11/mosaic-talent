"use client";

import { motion } from "framer-motion";
import { CheckCircle, Heart, MessageSquare, RotateCcw, TrendingUp } from "lucide-react";
import { Button, Card, Progress, Space, Tag, Typography } from "antd";
import { useStyles } from "./style";

interface IFeedback {
  communicationScore: number;
  empathyScore: number;
  resolutionScore: number;
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  tips: string[];
  generatedByAi: boolean;
}

interface IProps {
  scenarioTitle: string;
  feedback: IFeedback;
  onReset: () => void;
}

export const SimulationFeedback = ({ scenarioTitle, feedback, onReset }: IProps) => {
  const { styles } = useStyles();

  const scoreRows = [
    { label: "Communication", value: feedback.communicationScore, icon: <MessageSquare size={14} /> },
    { label: "Empathy", value: feedback.empathyScore, icon: <Heart size={14} /> },
    { label: "Resolution", value: feedback.resolutionScore, icon: <CheckCircle size={14} /> },
  ];

  return (
    <div className={styles.page}>
      <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
        <Typography.Title level={2} className={styles.title}>Simulation Complete</Typography.Title>
        <Typography.Paragraph className={styles.subtitle}>
          {scenarioTitle}
          <Tag color={feedback.generatedByAi ? "green" : "default"} style={{ marginLeft: 8 }}>
            {feedback.generatedByAi ? "AI Generated" : "Fallback"}
          </Tag>
        </Typography.Paragraph>
      </motion.div>

      <Card>
        <Typography.Text type="secondary">Overall Performance</Typography.Text>
        <Typography.Title level={1} className={styles.scoreBig}>{feedback.overallScore}%</Typography.Title>
        <Typography.Paragraph>{feedback.summary}</Typography.Paragraph>
      </Card>

      <div className={styles.historyGrid}>
        {scoreRows.map((row) => (
          <Card key={row.label}>
            <Space>
              {row.icon}
              <Typography.Text>{row.label}</Typography.Text>
            </Space>
            <Typography.Title level={3}>{row.value}%</Typography.Title>
            <Progress percent={row.value} showInfo={false} />
          </Card>
        ))}
      </div>

      <div className={styles.historyGrid}>
        <Card title={<Space><CheckCircle size={14} />Strengths</Space>}>
          <ul>
            {feedback.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
        <Card title={<Space><TrendingUp size={14} />Improvements</Space>}>
          <ul>
            {feedback.improvements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Pro Tips">
        <ul>
          {feedback.tips.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>

      <Space>
        <Button type="primary" icon={<RotateCcw size={14} />} onClick={onReset}>
          Try Another Scenario
        </Button>
      </Space>
    </div>
  );
};
