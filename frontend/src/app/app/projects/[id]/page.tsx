"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dropdown,
  Input,
  Modal,
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
import { IProjectTask } from "@/providers/project-provider/context";
import { useStyles } from "./style";

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
  const projectId = params.id;
  const router = useRouter();

  const [isFillingTeam, setIsFillingTeam] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [draggingTask, setDraggingTask] = useState<IProjectTask | null>(null);
  const [activeColumn, setActiveColumn] = useState<
    "todo" | "in-progress" | "done" | null
  >(null);

  const { styles } = useStyles();
  const { currentUser, isPending } = useDeveloperState();
  const { selectedProject: project, myProjects } = useProjectState();
  const { fetchCurrentUser } = useDeveloperAction();
  const {
    fetchProjectById,
    fetchMyProjects,
    joinProject,
    aiFillTeam,
    addProjectTask,
    updateProjectTaskStatus,
    completeProject,
  } = useProjectAction();

  useEffect(() => {
    if (!projectId) return;
    fetchCurrentUser();
    void fetchMyProjects();
    void fetchProjectById(projectId);
  }, [projectId]);

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
    <div className={styles.page}>
      <Link href="/app/projects" className={styles.backButton}>
        <Button icon={<ArrowLeft size={14} />}>Back to Projects</Button>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
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
        </div>

        {project.status !== "completed" ? (
          <div className={styles.actionRow}>
            {!isMember && project.status === "open" ? (
              <Button type="primary" onClick={handleJoinProject}>
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
                    <Typography.Text ellipsis>{member.name}</Typography.Text>
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
            <div className={styles.taskHeader}>
              <Typography.Text strong>Tasks</Typography.Text>
              {isMember && project.status !== "completed" ? (
                <Button
                  type="primary"
                  icon={<Plus size={14} />}
                  onClick={() => setIsAddTaskOpen(true)}
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
        >
          {project.tasks.length === 0 ? (
            <div className={styles.notFound}>
              <Typography.Text type="secondary">No tasks yet.</Typography.Text>
              {isMember && project.status !== "completed" ? (
                <div className={styles.addFirstTaskRow}>
                  <Button
                    onClick={() => setIsAddTaskOpen(true)}
                    icon={<Plus size={14} />}
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
                            draggable={isMember && project.status !== "completed"}
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
      >
        <div className={styles.modalBody}>
          <Input
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
            placeholder="Task title"
            onPressEnter={handleAddTask}
          />
          <Input.TextArea
            rows={4}
            value={newTaskDescription}
            onChange={(event) => setNewTaskDescription(event.target.value)}
            placeholder="Optional task description"
          />
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;
