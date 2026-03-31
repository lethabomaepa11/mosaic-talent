"use client";

import Link from "next/link";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Progress,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { ChevronRight, Clock } from "lucide-react";
import {
  IProject,
  IRepoSafetyProgress,
  IRepoSafetyResult,
} from "@/providers/project-provider/context";
import { useStyles } from "./styles";
import { GithubFilled } from "@ant-design/icons";

interface IProjectCardProps {
  project: IProject;
  isMember?: boolean;
  onJoin?: () => void;
  repoSafety?: IRepoSafetyResult;
  repoSafetyProgress?: IRepoSafetyProgress[];
  isRepoSafetyPending?: boolean;
  repoSafetyError?: string;
  onScanRepo?: () => void;
}

const statusColors: Record<string, string> = {
  completed: "green",
  "in-progress": "gold",
  draft: "default",
  open: "blue",
};

export const ProjectCard = ({
  project,
  isMember,
  onJoin,
  repoSafety,
  repoSafetyProgress,
  isRepoSafetyPending,
  repoSafetyError,
  onScanRepo,
}: IProjectCardProps) => {
  const { styles } = useStyles();
  const tasksDone = project.tasks.filter(
    (task) => task.status === "done",
  ).length;
  const totalTasks = project.tasks.length;
  const progress =
    totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;
  const membersShown = project.members.slice(0, 4);
  const lastRepoProgress =
    repoSafetyProgress && repoSafetyProgress.length > 0
      ? repoSafetyProgress[repoSafetyProgress.length - 1]
      : undefined;
  const riskLevel = repoSafety?.riskLevel?.toLowerCase() ?? "";
  const riskColor =
    riskLevel === "low" ? "green" : riskLevel === "medium" ? "gold" : riskLevel === "high" ? "red" : "default";
  const riskLabel = riskLevel ? (riskLevel === "low" ? "Safe" : `Risk: ${riskLevel}`) : "";

  return (
    <Card className={styles.card}>
      <div className={styles.cardTitleRow}>
        <div>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {project.title}
          </Typography.Title>
          {project.githubRepo ? (
            <a
              className={styles.repoLink}
              href={project.githubRepo}
              target="_blank"
              rel="noreferrer"
            >
              <Space size={4}>
                <GithubFilled />
                <span>{project.githubRepo}</span>
              </Space>
            </a>
          ) : null}
          <Typography.Paragraph
            ellipsis={{ rows: 2 }}
            className={styles.description}
          >
            {project.description}
          </Typography.Paragraph>
        </div>
        <Badge
          color={statusColors[project.status] ?? "default"}
          text={project.status}
        />
      </div>

      {project.githubRepo ? (
        <div className={styles.repoSafetyRow}>
          {repoSafety ? <Tag color={riskColor}>{riskLabel}</Tag> : null}
          {repoSafetyError ? (
            <Typography.Text className={styles.repoSafetyError}>
              {repoSafetyError}
            </Typography.Text>
          ) : null}
          {isRepoSafetyPending ? (
            <Space size={6} className={styles.repoSafetyProgress}>
              <Spin size="small" />
              <Typography.Text type="secondary" className={styles.repoSafetyStep}>
                {lastRepoProgress?.step ?? "Scanning repository..."}
              </Typography.Text>
            </Space>
          ) : !repoSafety ? (
            <Button size="small" onClick={onScanRepo} data-ai-action="scan-repo-safety">
              Check Repo Safety
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className={styles.teamRow}>
        <div className={styles.memberRow}>
          <div className={styles.avatarStack}>
            {membersShown.map((member) => (
              <Avatar
                key={member.id}
                src={member.avatar || undefined}
                className={styles.avatarItem}
              >
                {member.name.slice(0, 1).toUpperCase()}
              </Avatar>
            ))}
          </div>
          <Typography.Text type="secondary">
            {project.members.length}/{project.maxMembers}
          </Typography.Text>
        </div>

        {totalTasks > 0 ? (
          <Typography.Text type="secondary">
            {tasksDone}/{totalTasks} tasks
          </Typography.Text>
        ) : null}
      </div>

      {typeof project.matchScore === "number" && project.matchScore > 0 ? (
        <div className={styles.scoreRow}>
          <Typography.Text type="secondary">Match Score</Typography.Text>
          <Tag color="gold">{project.matchScore}%</Tag>
        </div>
      ) : null}

      {totalTasks > 0 ? (
        <Progress percent={progress} showInfo={false} size="small" />
      ) : null}

      <p className={styles.matchLine}>
        You&apos;re a match if you have these skills or willing to learn:
        <span className={styles.matchSkills}>
          {(project.skills.length > 0 ? project.skills : ["Adaptability"])
            .slice(0, 4)
            .map((skill) => (
              <Tag key={skill}>{skill}</Tag>
            ))}
        </span>
      </p>

      <div className={styles.footerRow}>
        <Space>
          <Clock size={14} />
          <span className={styles.dateText}>
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </Space>

        {isMember ? (
          <Link href={`/app/projects/${project.id}`}>
            <Button type="primary">
              Open Project <ChevronRight size={14} />
            </Button>
          </Link>
        ) : (
          <Space>
            <Link href={`/app/projects/${project.id}`}>
              <Button>View Project</Button>
            </Link>
            <Button type="primary" onClick={onJoin}>
              Join Project
            </Button>
          </Space>
        )}
      </div>
    </Card>
  );
};
