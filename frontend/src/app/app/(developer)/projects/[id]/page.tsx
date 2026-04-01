"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  GripVertical,
  Loader2,
  MoreHorizontal,
  Plus,
  Sparkles,
  Users,
  Lightbulb,
} from "lucide-react";
import {
  Avatar,
  Alert,
  Badge,
  Button,
  Card,
  Dropdown,
  Input,
  Modal,
  Progress,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { toast } from "@/components/providers";
import {
  useDeveloperAction,
  useDeveloperState,
} from "@/providers/developer-provider";
import {
  useProjectAction,
  useProjectState,
} from "@/providers/project-provider";
import {
  IProjectTask,
  IRepoSafetyScan,
  IRepoGuardianScan,
} from "@/providers/project-provider/context";
import { isRepoSafetyUnsafe } from "@/utils/repoSafety";
import { useStyles } from "./style";
import { GithubOutlined } from "@ant-design/icons";

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const columns: Array<{
  id: "todo" | "in-progress" | "done";
  title: string;
}> = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

const statusColor = (status: string) => {
  if (status === "completed") return "green";
  if (status === "in-progress") return "gold";
  if (status === "draft") return "default";
  return "blue";
};

const ProjectDetailPage = () => {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const projectId = params.id;
  const router = useRouter();

  const [isFillingTeam, setIsFillingTeam] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");
  const [draggingTask, setDraggingTask] = useState<IProjectTask | null>(null);
  const [activeColumn, setActiveColumn] = useState<
    "todo" | "in-progress" | "done" | null
  >(null);
  const [repoSafetyScan, setRepoSafetyScan] = useState<IRepoSafetyScan | undefined>(
    undefined,
  );
  const [repoSafetyPending, setRepoSafetyPending] = useState(false);
  const [repoSafetyError, setRepoSafetyError] = useState<string | null>(null);
  const [repoGuardianScan, setRepoGuardianScan] = useState<IRepoGuardianScan | undefined>(
    undefined,
  );
  const [repoGuardianPending, setRepoGuardianPending] = useState(false);
  const [repoGuardianError, setRepoGuardianError] = useState<string | null>(null);

  const { styles } = useStyles();
  const { currentUser, isPending } = useDeveloperState();
  const { selectedProject: project, myProjects, lastMatch } = useProjectState();
  const { fetchCurrentUser } = useDeveloperAction();
  const {
    fetchProjectById,
    fetchMyProjects,
    joinProject,
    aiFillTeam,
    addProjectTask,
    updateProjectTaskStatus,
    updateProjectSkills,
    completeProject,
    scanRepoSafety,
    scanRepoGuardian,
  } = useProjectAction();

  useEffect(() => {
    if (!projectId) return;
    fetchCurrentUser();
    void fetchMyProjects();
    void fetchProjectById(projectId);
    setRepoSafetyScan(undefined);
    setRepoSafetyError(null);
    setRepoGuardianScan(undefined);
    setRepoGuardianError(null);
  }, [projectId]);

  useEffect(() => {
    if (!project?.githubRepo) return;
    const githubUrl = project.githubRepo;
    if (!githubUrl.includes("github.com")) return;

    setRepoGuardianPending(true);
    setRepoGuardianScan(undefined);
    setRepoGuardianError(null);

    scanRepoGuardian(githubUrl)
      .then((result) => {
        setRepoGuardianScan(result);
      })
      .catch((error) => {
        setRepoGuardianError(
          error instanceof Error ? error.message : "Failed to scan repository",
        );
      })
      .finally(() => {
        setRepoGuardianPending(false);
      });
  }, [project?.githubRepo]);

  useEffect(() => {
    if (!projectId || !project?.githubRepo) {
      return;
    }

    let isActive = true;
    setRepoSafetyPending(true);
    setRepoSafetyError(null);

    scanRepoSafety(projectId)
      .then((result) => {
        if (isActive) {
          setRepoSafetyScan(result);
        }
      })
      .catch((error) => {
        if (isActive) {
          setRepoSafetyError(
            error instanceof Error ? error.message : "Failed to scan repository.",
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setRepoSafetyPending(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [projectId, project?.githubRepo, scanRepoSafety]);

  const isMember = useMemo(() => {
    return myProjects.some((item) => item.id === projectId);
  }, [myProjects, projectId]);

  const canComplete = useMemo(() => {
    if (!project) return false;
    return (
      project.status !== "completed" &&
      project.tasks.length > 0 &&
      project.tasks.every((task) => task.status === "done")
    );
  }, [project]);

  const shouldShowMatchInsight = useMemo(() => {
    return (
      searchParams.get("from") === "ai-match" &&
      lastMatch?.projectId === projectId
    );
  }, [searchParams, lastMatch, projectId]);

  const repoSafetyResult = repoSafetyScan?.result;
  const lastRepoSafetyStep =
    repoSafetyScan?.progress && repoSafetyScan.progress.length > 0
      ? repoSafetyScan.progress[repoSafetyScan.progress.length - 1]
      : undefined;
  const riskLevel = repoSafetyResult?.riskLevel?.toLowerCase() ?? "";
  const riskColor =
    riskLevel === "low"
      ? "green"
      : riskLevel === "medium"
        ? "gold"
        : riskLevel === "high"
          ? "red"
          : "default";
  const riskLabel = riskLevel
    ? riskLevel === "low"
      ? "Safe"
      : `Risk: ${riskLevel}`
    : "Unknown";
  const riskScore = repoSafetyResult?.riskScore ?? 0;
  const repoSafetyUnsafe = isRepoSafetyUnsafe(repoSafetyResult);

  const handleFillTeam = async () => {
    if (!projectId) return;
    setIsFillingTeam(true);
    try {
      await aiFillTeam(projectId);
      toast.success("Team updated", "AI added available team members.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fill team.";
      toast.error("Fill team failed", message);
    } finally {
      setIsFillingTeam(false);
    }
  };

  const handleAddTask = async () => {
    if (!projectId || !isMember || !newTaskTitle.trim()) {
      return;
    }

    try {
      await addProjectTask(projectId, {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
      });
      setNewTaskTitle("");
      setNewTaskDescription("");
      setIsAddTaskOpen(false);
      toast.success("Task added", "The project task has been created.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add task.";
      toast.error("Task add failed", message);
    }
  };

  const handleMoveTask = async (
    taskId: string,
    status: "todo" | "in-progress" | "done",
  ) => {
    if (!projectId || !isMember) return;

    try {
      await updateProjectTaskStatus(projectId, taskId, status);
      toast.success("Task updated", "Task status has been updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update task.";
      toast.error("Task update failed", message);
    }
  };

  const handleDragStart = (task: IProjectTask) => {
    setDraggingTask(task);
  };

  const handleDragEnd = () => {
    setDraggingTask(null);
    setActiveColumn(null);
  };

  const handleDragOverColumn = (
    event: DragEvent<HTMLDivElement>,
    columnId: "todo" | "in-progress" | "done",
  ) => {
    if (!isMember || project?.status === "completed") return;
    event.preventDefault();
    setActiveColumn(columnId);
  };

  const handleDropOnColumn = async (
    event: DragEvent<HTMLDivElement>,
    columnId: "todo" | "in-progress" | "done",
  ) => {
    event.preventDefault();

    if (!isMember) {
      handleDragEnd();
      return;
    }

    if (!draggingTask || draggingTask.status === columnId) {
      handleDragEnd();
      return;
    }

    await handleMoveTask(draggingTask.id, columnId);
    handleDragEnd();
  };

  const handleCompleteProject = async () => {
    if (!projectId || !isMember) return;

    setIsCompleting(true);
    try {
      await completeProject(projectId);
      toast.success(
        "Project completed",
        "Project has been marked as completed.",
      );
      router.push("/app/reviews");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to complete project.";
      toast.error("Completion failed", message);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleJoinProject = async () => {
    if (!projectId) return;

    try {
      await joinProject(projectId);
      await Promise.all([fetchMyProjects(), fetchProjectById(projectId)]);
      toast.success("Joined project", "You are now a member of this project.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to join project.";
      toast.error("Join failed", message);
    }
  };

  const handleOpenSkillsEditor = () => {
    setSkillsInput(project!.skills.join(", "));
    setIsSkillsOpen(true);
  };

  const handleUpdateSkills = async () => {
    if (!projectId || !isMember) return;

    try {
      const skills = skillsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      await updateProjectSkills(projectId, skills);
      setIsSkillsOpen(false);
      toast.success("Skills updated", "Project match skills were updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update skills.";
      toast.error("Update failed", message);
    }
  };

  if (isPending && !project) {
    return (
      <div className={styles.notFound}>
        <Spin />
      </div>
    );
  }

  if (!project || project.id !== projectId) {
    return (
      <div className={styles.notFound}>
        <Typography.Title level={4}>Project not found</Typography.Title>
        <Link href="/app/projects">
          <Button type="primary">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page} data-ai-page="project-detail">
      <Link href="/app/projects" className={styles.backButton}>
        <Button icon={<ArrowLeft size={14} />}>Back to Projects</Button>
      </Link>

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div>
          <div className={styles.titleRow}>
            <Typography.Title level={2} style={{ margin: 0 }}>
              {project.title}
            </Typography.Title>
            <Tag color={statusColor(project.status)}>{project.status}</Tag>
          </div>
          <Typography.Paragraph className={styles.description}>
            {project.description}
          </Typography.Paragraph>
          {project.githubRepo ? (
            <a
              className={styles.repoLink}
              href={project.githubRepo}
              target="_blank"
              rel="noreferrer"
            >
              <GithubOutlined size={14} />
              <span>{project.githubRepo}</span>
            </a>
          ) : null}
          <div className={styles.skillPitch}>
            <span className={styles.skillTitle}>
              You&apos;re a match if you have these skills or willing to learn:
            </span>
            <div className={styles.skillTagWrap}>
              {(project.skills.length > 0
                ? project.skills
                : ["Adaptability"]
              ).map((skill) => (
                <Tag key={skill}>{skill}</Tag>
              ))}
            </div>
            {isMember ? (
              <div className={styles.skillEditRow}>
                <Button size="small" onClick={handleOpenSkillsEditor} data-ai-action="open-project-skills-editor">
                  Update looking-for skills
                </Button>
              </div>
            ) : null}
          </div>

          {shouldShowMatchInsight ? (
            <div className={styles.matchInsightBox}>
              <div className={styles.matchInsightTitle}>
                <Lightbulb size={14} />
                <span>Why this project is your best match</span>
              </div>
              <Typography.Paragraph className={styles.matchInsightText}>
                {lastMatch?.insight || "This project best aligns with your current profile."}
              </Typography.Paragraph>
              <div className={styles.matchInsightLearn}>
                <Typography.Text strong>You will most likely learn:</Typography.Text>
                <ul className={styles.learnList}>
                  {(lastMatch?.learningOutcomes ?? []).length > 0 ? (
                    lastMatch?.learningOutcomes.map((outcome) => (
                      <li key={outcome}>{outcome}</li>
                    ))
                  ) : (
                    <li>Hands-on collaboration and delivery in a real project context.</li>
                  )}
                </ul>
              </div>
            </div>
          ) : null}
        </div>

        {project.status !== "completed" ? (
          <div className={styles.actionRow}>
            {!isMember && project.status === "open" ? (
              <Button type="primary" onClick={handleJoinProject} data-ai-action="join-project">
                Join Project
              </Button>
            ) : null}

            {isMember && project.members.length < project.maxMembers ? (
              <Button
                onClick={handleFillTeam}
                loading={isFillingTeam}
                icon={
                  isFillingTeam ? <Loader2 size={14} /> : <Sparkles size={14} />
                }
                data-ai-action="ai-fill-team"
              >
                AI Fill Team
              </Button>
            ) : null}

            {isMember && canComplete ? (
              <Button
                type="primary"
                onClick={handleCompleteProject}
                loading={isCompleting}
                icon={<CheckCircle size={14} />}
                data-ai-action="complete-project"
              >
                Complete Project
              </Button>
            ) : null}
          </div>
        ) : null}
      </motion.div>

      <div className={styles.contentGrid}>
        <Card
          title={
            <Space>
              <Users size={16} />
              Team ({project.members.length}/{project.maxMembers})
            </Space>
          }
          className={styles.membersCard}
        >
          <Space direction="vertical" size="small" className={styles.fullWidth}>
            {project.members.map((member) => {
              const isYou = String(member.id) === String(currentUser?.id);
              return (
                <div className={styles.memberItem} key={member.id}>
                  <Avatar src={member.avatar || undefined}>
                    {member.name.slice(0, 1).toUpperCase()}
                  </Avatar>
                  <div className={styles.memberMeta}>
                    {member.userName ? (
                      <Link
                        href={`/developers/${encodeURIComponent(member.userName)}`}
                        className={styles.memberLink}
                      >
                        <Typography.Text ellipsis>{member.name}</Typography.Text>
                      </Link>
                    ) : (
                      <Typography.Text ellipsis>{member.name}</Typography.Text>
                    )}
                    <Typography.Text
                      type="secondary"
                      style={{ display: "block" }}
                    >
                      {member.role}
                    </Typography.Text>
                  </div>
                  {isYou ? <Badge color="gold" text="You" /> : null}
                </div>
              );
            })}

            {project.members.length < project.maxMembers ? (
              <div className={styles.openSpots}>
                {project.maxMembers - project.members.length} spots available
              </div>
            ) : null}
          </Space>
        </Card>

        <Card
          title={
            <Space>
              <CheckCircle size={16} />
              Repo Safety
            </Space>
          }
          className={styles.repoSafetyCard}
        >
          {!project.githubRepo ? (
            <Typography.Text type="secondary">
              No GitHub repository linked to this project.
            </Typography.Text>
          ) : (
            <div className={styles.repoSafetyBody}>
              {repoSafetyError ? (
                <Alert
                  type="error"
                  message={repoSafetyError}
                  showIcon
                  className={styles.repoSafetyAlert}
                />
              ) : null}

              {repoSafetyPending ? (
                <div className={styles.repoSafetyProgress}>
                  <Space size={8} align="center">
                    <Spin size="small" />
                    <Typography.Text type="secondary">
                      {lastRepoSafetyStep?.step ?? "Scanning repository..."}
                    </Typography.Text>
                  </Space>
                  <Progress
                    percent={lastRepoSafetyStep?.progress ?? 0}
                    size="small"
                  />
                </div>
              ) : null}

              {repoSafetyResult ? (
                <div className={styles.repoSafetySummary}>
                  <div className={styles.repoSafetyHeader}>
                    <Tag color={riskColor}>{riskLabel}</Tag>
                    <Typography.Text type="secondary">
                      Risk score: {riskScore}
                    </Typography.Text>
                    {repoSafetyResult.cached ? (
                      <Tag color="default">Cached</Tag>
                    ) : null}
                  </div>

                  {repoSafetyResult.meta ? (
                    <div className={styles.repoSafetyMeta}>
                      <Typography.Text>
                        {repoSafetyResult.meta.language || "Unknown language"}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        Stars: {repoSafetyResult.meta.stars ?? 0}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        Forks: {repoSafetyResult.meta.forks ?? 0}
                      </Typography.Text>
                    </div>
                  ) : null}

                  {repoSafetyResult.badges.length > 0 ? (
                    <div className={styles.repoSafetyBadges}>
                      {repoSafetyResult.badges.map((badge, index) => (
                        <Tag
                          key={`${badge.label}-${badge.type}-${index}`}
                          color={badge.type === "warning" ? "gold" : "blue"}
                        >
                          {badge.label}
                        </Tag>
                      ))}
                    </div>
                  ) : null}

                  {repoSafetyResult.findings.length > 0 ? (
                    <div className={styles.repoSafetyFindings}>
                      <Typography.Text strong>Findings</Typography.Text>
                      <ul className={styles.repoSafetyList}>
                        {repoSafetyResult.findings.slice(0, 3).map((finding, index) => (
                          <li key={`${finding.ruleId}-${finding.filePath}-${index}`}>
                            <Typography.Text>
                              {finding.title}
                              {finding.filePath ? ` (${finding.filePath})` : ""}
                            </Typography.Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <Typography.Text type="secondary">
                      No high-risk findings detected.
                    </Typography.Text>
                  )}
                  {repoSafetyUnsafe ? (
                    <Alert
                      type="error"
                      showIcon
                      message="Unsafe repository detected"
                      description="Potentially malicious code was found. Team members should review findings before continuing work."
                      className={styles.repoSafetyAlert}
                    />
                  ) : null}
                </div>
              ) : (
                <Typography.Text type="secondary">
                  Safety scan runs automatically when this page loads.
                </Typography.Text>
              )}
            </div>
          )}
        </Card>

        <Card
          title={
            <Space>
              <CheckCircle size={16} />
              Repository Analysis
            </Space>
          }
          className={styles.repoSafetyCard}
        >
          {!project.githubRepo ? (
            <Typography.Text type="secondary">
              No GitHub repository linked to this project.
            </Typography.Text>
          ) : (
            <div className={styles.repoSafetyBody}>
              {repoGuardianError ? (
                <Alert
                  type="error"
                  message={repoGuardianError}
                  showIcon
                  className={styles.repoSafetyAlert}
                />
              ) : null}

              {repoGuardianPending ? (
                <div className={styles.repoSafetyProgress}>
                  <Space size={8} align="center">
                    <Spin size="small" />
                    <Typography.Text type="secondary">
                      Scanning repository...
                    </Typography.Text>
                  </Space>
                </div>
              ) : null}

              {repoGuardianScan?.result ? (
                <div className={styles.repoSafetySummary}>
                  <div className={styles.repoSafetyHeader}>
                    <Tag color={repoGuardianScan.result.overallScore >= 70 ? "green" : repoGuardianScan.result.overallScore >= 40 ? "gold" : "red"}>
                      Score: {repoGuardianScan.result.overallScore}
                    </Tag>
                    <Typography.Text type="secondary">
                      Status: {repoGuardianScan.result.status}
                    </Typography.Text>
                  </div>

                  {repoGuardianScan.result.categoryScores.length > 0 ? (
                    <div className={styles.repoSafetyMeta}>
                      {repoGuardianScan.result.categoryScores.map((cat, index) => (
                        <Tag key={`cat-${index}`} color={cat.score >= 70 ? "green" : cat.score >= 40 ? "gold" : "red"}>
                          {cat.category}: {cat.score}
                        </Tag>
                      ))}
                    </div>
                  ) : null}

                  {repoGuardianScan.result.ruleResults.length > 0 ? (
                    <div className={styles.repoSafetyFindings}>
                      <Typography.Text strong>Rule Results</Typography.Text>
                      <ul className={styles.repoSafetyList}>
                        {repoGuardianScan.result.ruleResults.slice(0, 5).map((rule, index) => (
                          <li key={`${rule.ruleId}-${index}`}>
                            <Typography.Text>
                              {rule.passed ? "✓" : "✗"} {rule.ruleName} ({rule.category})
                            </Typography.Text>
                            <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                              {rule.details}
                            </Typography.Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {repoGuardianScan.result.recommendations.length > 0 ? (
                    <div className={styles.repoSafetyFindings}>
                      <Typography.Text strong>Recommendations</Typography.Text>
                      <ul className={styles.repoSafetyList}>
                        {repoGuardianScan.result.recommendations.map((rec, index) => (
                          <li key={`rec-${index}`}>
                            <Typography.Text>
                              {rec.issueDescription}
                            </Typography.Text>
                            <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                              {rec.suggestedFix}
                            </Typography.Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Typography.Text type="secondary">
                  Scanning repository for analysis...
                </Typography.Text>
              )}
            </div>
          )}
        </Card>

        <Card
          title={
            <div className={styles.taskHeader}>
              <Typography.Text strong>Tasks</Typography.Text>
              {isMember && project.status !== "completed" ? (
                <Button
                  type="primary"
                  icon={<Plus size={14} />}
                  onClick={() => setIsAddTaskOpen(true)}
                  data-ai-action="open-add-project-task"
                >
                  Add Task
                </Button>
              ) : null}
              {!isMember ? (
                <Typography.Text type="secondary">
                  Read-only. Join to update tasks.
                </Typography.Text>
              ) : null}
            </div>
          }
          className={styles.tasksCard}
        >
          {project.tasks.length === 0 ? (
            <div className={styles.notFound}>
              <Typography.Text type="secondary">No tasks yet.</Typography.Text>
              {isMember && project.status !== "completed" ? (
                <div className={styles.addFirstTaskRow}>
                  <Button
                    onClick={() => setIsAddTaskOpen(true)}
                    icon={<Plus size={14} />}
                    data-ai-action="open-add-project-task"
                  >
                    Add First Task
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className={styles.boardGrid}>
              {columns.map((column) => {
                const columnTasks = project.tasks.filter(
                  (task) => task.status === column.id,
                );
                const columnClassName =
                  column.id === "todo"
                    ? styles.columnTodo
                    : column.id === "in-progress"
                      ? styles.columnInProgress
                      : styles.columnDone;

                return (
                  <div
                    key={column.id}
                    className={cx(
                      styles.column,
                      columnClassName,
                      activeColumn === column.id && styles.columnActive,
                    )}
                    onDragOver={(event) =>
                      handleDragOverColumn(event, column.id)
                    }
                    onDragLeave={() => setActiveColumn(null)}
                    onDrop={(event) =>
                      void handleDropOnColumn(event, column.id)
                    }
                  >
                    <div className={styles.columnHeader}>
                      <Typography.Text strong>{column.title}</Typography.Text>
                      <Badge count={columnTasks.length} />
                    </div>

                    <Space
                      direction="vertical"
                      size="small"
                      className={styles.fullWidth}
                    >
                      {columnTasks.map((task: IProjectTask) => {
                        const options = columns
                          .filter((item) => item.id !== column.id)
                          .map((item) => ({
                            key: item.id,
                            label: `Move to ${item.title}`,
                          }));

                        return (
                          <div
                            key={task.id}
                            className={cx(
                              styles.taskCard,
                              draggingTask?.id === task.id &&
                                styles.taskDragging,
                            )}
                            draggable={
                              isMember && project.status !== "completed"
                            }
                            onDragStart={() => handleDragStart(task)}
                            onDragEnd={handleDragEnd}
                          >
                            <div className={styles.taskRow}>
                              <Space align="start">
                                <GripVertical size={14} />
                                <div>
                                  <p className={styles.taskTitle}>
                                    {task.title}
                                  </p>
                                  {task.description ? (
                                    <p className={styles.taskDescription}>
                                      {task.description}
                                    </p>
                                  ) : null}
                                </div>
                              </Space>

                              {isMember && project.status !== "completed" ? (
                                <Dropdown
                                  menu={{
                                    items: options,
                                    onClick: ({ key }) =>
                                      handleMoveTask(
                                        task.id,
                                        key as "todo" | "in-progress" | "done",
                                      ),
                                  }}
                                  trigger={["click"]}
                                >
                                  <Button
                                    type="text"
                                    icon={<MoreHorizontal size={14} />}
                                  />
                                </Dropdown>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}

                      {columnTasks.length === 0 ? (
                        <div className={styles.emptyColumn}>No tasks</div>
                      ) : null}
                    </Space>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Modal
        title="Add New Task"
        open={isAddTaskOpen}
        onCancel={() => setIsAddTaskOpen(false)}
        onOk={handleAddTask}
        okText="Add Task"
        okButtonProps={{ "data-ai-action": "submit-add-project-task" }}
      >
        <div className={styles.modalBody}>
          <Input
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
            placeholder="Task title"
            onPressEnter={handleAddTask}
            data-ai-field="project-task-title"
          />
          <Input.TextArea
            rows={4}
            value={newTaskDescription}
            onChange={(event) => setNewTaskDescription(event.target.value)}
            placeholder="Optional task description"
            data-ai-field="project-task-description"
          />
        </div>
      </Modal>

      <Modal
        title="Update Match Skills"
        open={isSkillsOpen}
        onCancel={() => setIsSkillsOpen(false)}
        onOk={handleUpdateSkills}
        okText="Save Skills"
        okButtonProps={{ "data-ai-action": "submit-project-skills" }}
      >
        <Input.TextArea
          rows={4}
          value={skillsInput}
          onChange={(event) => setSkillsInput(event.target.value)}
          placeholder="React, TypeScript, PostgreSQL"
          data-ai-field="project-skills-input"
        />
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;

