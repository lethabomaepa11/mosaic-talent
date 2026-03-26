"use client";

import { Progress } from "antd";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  Code,
  Compass,
  Lightbulb,
  MessageSquare,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { designTokens } from "@/theme/antdTheme";
import { useStyles } from "./styles";

const scores = [
  { label: "Code Quality", value: 85, icon: Code },
  { label: "Communication", value: 78, icon: MessageSquare },
  { label: "Collaboration", value: 82, icon: Users },
  { label: "Problem Solving", value: 88, icon: Lightbulb },
  { label: "Adaptability", value: 74, icon: Compass },
  { label: "Leadership", value: 71, icon: User },
];

const overallScore = 81;
const potentialScore = 89;

export const InsightReportDemo = () => {
  const { styles } = useStyles();

  return (
    <motion.div
      className={styles.root}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
    >
      <div className={styles.header}>
        <div className={styles.userWrap}>
          <div className={styles.avatar}>TK</div>
          <div>
            <h3 className={styles.title}>Thabo Khumalo</h3>
            <p className={styles.subtitle}>
              Senior Frontend Developer Candidate
            </p>
          </div>
        </div>
        <div>
          <div className={styles.scoreLabel}>Overall Fit Score</div>
          <p className={styles.scoreValue}>{overallScore}%</p>
        </div>
      </div>

      <div className={styles.grid}>
        {scores.map((score, i) => (
          <div key={score.label} className={styles.scoreCard}>
            <div className={styles.scoreHead}>
              <div className={styles.scoreMeta}>
                <score.icon size={14} />
                <span>{score.label}</span>
              </div>
              <span className={styles.scoreNumber}>{score.value}%</span>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Progress
                percent={score.value}
                showInfo={false}
                strokeColor={
                  score.value >= 80
                    ? designTokens.teal
                    : score.value >= 70
                      ? designTokens.gold
                      : designTokens.goldMid
                }
                railColor={designTokens.border}
                size={[0, 8]}
              />
            </motion.div>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <TrendingUp size={18} color={designTokens.teal} />
          <span>12-Month Potential Projection</span>
        </h4>
        <div className={styles.projection}>
          <div className={styles.projectionMain}>
            <Progress
              percent={potentialScore}
              showInfo={false}
              strokeColor={{
                "0%": designTokens.gold,
                "100%": designTokens.teal,
              }}
              railColor={designTokens.border}
              size={[0, 10]}
            />
            <div className={styles.projectionMeta}>
              <span>Current: {overallScore}%</span>
              <span>Projected: {potentialScore}%</span>
            </div>
          </div>
          <div className={styles.growthBox}>
            <p className={styles.growthValue}>
              +{potentialScore - overallScore}%
            </p>
            <div className={styles.scoreLabel}>Growth Potential</div>
          </div>
        </div>
      </div>

      <div className={styles.insightsGrid}>
        <div className={styles.insightsCol}>
          <h4 className={styles.sectionTitle}>
            <CheckCircle size={16} color={designTokens.teal} />
            <span className={styles.titleSuccess}>Key Strengths</span>
          </h4>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              <span className={styles.dot} />
              Strong technical foundations with clean code practices
            </li>
            <li className={styles.listItem}>
              <span className={styles.dot} />
              Excellent problem-solving approach in complex scenarios
            </li>
            <li className={styles.listItem}>
              <span className={styles.dot} />
              Good communication skills demonstrated in peer reviews
            </li>
          </ul>
        </div>
        <div className={styles.insightsColSplit}>
          <h4 className={styles.sectionTitle}>
            <AlertTriangle size={16} color={designTokens.gold} />
            <span className={styles.titlePrimary}>Areas for Growth</span>
          </h4>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              <span className={styles.dotWarn} />
              Limited experience with large-scale distributed systems
            </li>
            <li className={styles.listItem}>
              <span className={styles.dotWarn} />
              Could benefit from more leadership opportunities
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.recommendation}>
        <div className={styles.recIcon}>
          <CheckCircle size={16} />
        </div>
        <div>
          <h4 className={styles.recTitle}>AI Recommendation</h4>
          <p className={styles.recText}>
            Strong candidate recommended for next interview round. Consider
            pairing with senior mentor for distributed systems exposure. High
            potential for growth into tech lead role within 12-18 months.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
