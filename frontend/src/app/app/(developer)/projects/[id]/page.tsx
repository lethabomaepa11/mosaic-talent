"use client";

import { useEffect, useMemo, useState, type DragEvent, type ReactNode } from "react";
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
  Video,
} from "lucide-react";
import {
  Avatar,
  Alert,
  Badge,
  Button,
  Card,
  DatePicker,
  Dropdown,
  Input,
  Modal,
  Popover,
  Progress,
  Skeleton,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Tabs,
  Typography,
} from "antd";
import type { Dayjs } from "dayjs";
import MDEditor from "@uiw/react-md-editor";
import NotFound from "@/app/not-found";
import { toast } from "@/components/providers";
import {
  useDeveloperAction,
  useDeveloperState,
} from "@/providers/developer-provider";
import {
  useProjectAction,
  useProjectState,
} from "@/providers/project-provider";
import { useAppearanceState } from "@/providers/appearance-provider";
import ProjectProgress from "@/components/project-progress/ProjectProgress";
import {
  IProjectJoinLoadWarning,
  IProjectInvite,
  IProjectMeeting,
  IProjectTask,
  IRepoGuardianScan,
  IRepoSafetyScan,
} from "@/providers/project-provider/context";
import { isRepoSafetyUnsafe } from "@/utils/repoSafety";
import { useStyles } from "./style";
import { resolveProjectDetailViewState } from "./projectLoadState";
import {
  BarChartOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  GithubOutlined,
  SafetyOutlined,
  TeamOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";

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

const meetingStatusColor = (status: IProjectMeeting["status"]) => {
  if (status === "scheduled") return "blue";
  if (status === "completed") return "green";
  if (status === "cancelled") return "red";
  return "gold";
};

const toLocalDateTimeInput = (isoDate: string) => {
  if (!isoDate) {
    return "";
  }

  const date = new Date(isoDate);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const localInputToIso = (localDateTime: string) => {
  return new Date(localDateTime).toISOString();
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
  const [newTaskAssignee, setNewTaskAssignee] = useState<string | undefined>(undefined);
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
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [removeMemberReason, setRemoveMemberReason] = useState("");
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [complaintInput, setComplaintInput] = useState("");
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [roleUpdateMemberId, setRoleUpdateMemberId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("repo-safety");
  const [joinWarning, setJoinWarning] = useState<IProjectJoinLoadWarning | null>(null);
  const [isJoiningProject, setIsJoiningProject] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [reassigningTaskId, setReassigningTaskId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<IProjectMeeting[]>([]);
  const [isMeetingsLoading, setIsMeetingsLoading] = useState(false);
  const [meetingReminderDraft, setMeetingReminderDraft] = useState<
    Record<string, { minutesBefore: number; enabled: boolean }>
  >({});
  const [isRequestMeetingOpen, setIsRequestMeetingOpen] = useState(false);
  const [requestMeetingTitle, setRequestMeetingTitle] = useState("");
  const [requestMeetingAgenda, setRequestMeetingAgenda] = useState("");
  const [requestMeetingRange, setRequestMeetingRange] = useState<
    [Dayjs, Dayjs] | null
  >(null);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);
  const [scheduleMeetingTarget, setScheduleMeetingTarget] = useState<IProjectMeeting | null>(null);
  const [scheduleMeetingTitle, setScheduleMeetingTitle] = useState("");
  const [scheduleMeetingAgenda, setScheduleMeetingAgenda] = useState("");
  const [scheduleMeetingStart, setScheduleMeetingStart] = useState("");
  const [scheduleMeetingEnd, setScheduleMeetingEnd] = useState("");
  const [scheduleMeetingRoom, setScheduleMeetingRoom] = useState("");
  const [projectInvites, setProjectInvites] = useState<IProjectInvite[]>([]);
  const [isInvitesLoading, setIsInvitesLoading] = useState(false);
  const [inviteActionTargetId, setInviteActionTargetId] = useState<string | null>(null);
  const [isProjectLoading, setIsProjectLoading] = useState(true);

  const { styles } = useStyles();
  const { mode } = useAppearanceState();
  const { currentUser } = useDeveloperState();
  const { selectedProject: project, myProjects, lastMatch } = useProjectState();
  const { fetchCurrentUser } = useDeveloperAction();
  const {
    fetchProjectById,
    fetchMyProjects,
    joinProject,
    getJoinProjectLoadWarning,
    leaveProject,
    deleteProject,
    removeProjectMember,
    submitProjectComplaint,
    assignMemberRole,
    setProjectMemberMentor,
    aiFillTeam,
    aiGenerateProjectTasks,
    addProjectTask,
    reassignProjectTask,
    updateProjectTaskStatus,
    updateProjectSkills,
    completeProject,
    getProjectInvites,
    acceptProjectInvite,
    rejectProjectInvite,
    scanRepoSafety,
    scanRepoGuardian,
    getProjectMeetings,
    requestProjectMeeting,
    scheduleProjectMeeting,
    setProjectMeetingReminder,
    cancelProjectMeeting,
  } = useProjectAction();

  useEffect(() => {
    if (!projectId) {
      setIsProjectLoading(false);
      return;
    }

    let isActive = true;
    setIsProjectLoading(true);
    fetchCurrentUser();
    void fetchMyProjects();
    fetchProjectById(projectId)
      .catch(() => undefined)
      .finally(() => {
        if (isActive) {
          setIsProjectLoading(false);
        }
      });
    setRepoSafetyScan(undefined);
    setRepoSafetyError(null);
    setRepoGuardianScan(undefined);
    setRepoGuardianError(null);

    return () => {
      isActive = false;
    };
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
  }, [projectId, project?.githubRepo]);

  const isMember = useMemo(() => {
    return myProjects.some((item) => item.id === projectId);
  }, [myProjects, projectId]);
  const currentMember = useMemo(() => {
    if (!project || !currentUser?.userName) {
      return undefined;
    }

    const normalizedUserName = currentUser.userName.toLowerCase();
    return project.members.find(
      (member) => (member.userName ?? "").toLowerCase() === normalizedUserName,
    );
  }, [project, currentUser?.userName]);
  const canManageMemberRoles = currentMember?.role === "lead";
  const canManageMeetings = canManageMemberRoles;
  const canDeleteProject =
    !!project &&
    !!currentMember &&
    project.ownerId === currentMember.id &&
    project.members.length === 1;
  const canLogComplaint =
    !!project &&
    !!currentMember &&
    project.ownerId !== currentMember.id &&
    currentMember.role !== "lead";
  const pendingInvites = useMemo(
    () => projectInvites.filter((invite) => invite.status === "pending"),
    [projectInvites],
  );
  const currentUserInvite = useMemo(() => {
    const normalizedUserName = (currentUser?.userName ?? "").toLowerCase();
    if (!normalizedUserName) {
      return undefined;
    }

    return pendingInvites.find(
      (invite) => (invite.developerUserName ?? "").toLowerCase() === normalizedUserName,
    );
  }, [pendingInvites, currentUser?.userName]);

  const canComplete = useMemo(() => {
    if (!project) return false;
    return (
      project.status !== "completed" &&
      project.tasks.length > 0 &&
      project.tasks.every((task) => task.status === "done")
    );
  }, [project]);
  const availableMemberSpots = useMemo(() => {
    if (!project) {
      return 0;
    }

    return Math.max(
      (project.maxMembers ?? 4) - (project.members.length + pendingInvites.length),
      0,
    );
  }, [project, pendingInvites.length]);

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
  const repoAnalysisSummary = useMemo(() => {
    const lines: string[] = [];

    if (repoSafetyResult) {
      lines.push("Repository safety scan:");
      lines.push(
        `- Risk level: ${repoSafetyResult.riskLevel || "unknown"} (score ${repoSafetyResult.riskScore})`,
      );
      if (repoSafetyResult.findings.length > 0) {
        lines.push("- Key findings:");
        repoSafetyResult.findings.slice(0, 5).forEach((finding) => {
          lines.push(
            `  - [${finding.severity || "info"}] ${finding.title}${finding.filePath ? ` (${finding.filePath})` : ""}`,
          );
        });
      }
    }

    if (repoGuardianScan?.result) {
      lines.push("Repository analysis scan:");
      lines.push(
        `- Overall score: ${repoGuardianScan.result.overallScore}, status: ${repoGuardianScan.result.status}`,
      );
      if (repoGuardianScan.result.categoryScores.length > 0) {
        lines.push("- Category scores:");
        repoGuardianScan.result.categoryScores.forEach((item) => {
          lines.push(`  - ${item.category}: ${item.score}`);
        });
      }
      if (repoGuardianScan.result.recommendations.length > 0) {
        lines.push("- Priority recommendations:");
        repoGuardianScan.result.recommendations.slice(0, 5).forEach((item) => {
          lines.push(`  - ${item.issueDescription}: ${item.suggestedFix}`);
        });
      }
    }

    return lines.join("\n").trim();
  }, [repoSafetyResult, repoGuardianScan?.result]);

  const loadProjectInvites = async () => {
    if (!projectId) {
      setProjectInvites([]);
      return;
    }

    setIsInvitesLoading(true);
    try {
      const invites = await getProjectInvites(projectId);
      setProjectInvites(invites);
    } catch {
      setProjectInvites([]);
    } finally {
      setIsInvitesLoading(false);
    }
  };

  const loadMeetings = async () => {
    if (!projectId || !isMember) {
      setMeetings([]);
      return;
    }

    setIsMeetingsLoading(true);
    try {
      const list = await getProjectMeetings(projectId);
      setMeetings(list);
      setMeetingReminderDraft(
        list.reduce<Record<string, { minutesBefore: number; enabled: boolean }>>(
          (acc, meeting) => {
            acc[meeting.id] = {
              minutesBefore: meeting.reminderMinutesBefore,
              enabled: meeting.reminderEnabled,
            };
            return acc;
          },
          {},
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load project meetings.";
      toast.error("Meeting load failed", message);
    } finally {
      setIsMeetingsLoading(false);
    }
  };

  useEffect(() => {
    void loadMeetings();
  }, [projectId, isMember]);
  useEffect(() => {
    void loadProjectInvites();
  }, [projectId, currentUser?.userName]);
  useEffect(() => {
    if (!isJoiningProject) {
      return;
    }

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "Joining project";
      return "Joining project";
    };

    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [isJoiningProject]);

  const handleFillTeam = async () => {
    if (!projectId) return;
    setIsFillingTeam(true);
    try {
      await aiFillTeam(projectId);
      toast.success("Invites sent", "AI sent project invites to suggested members.");
      await loadMeetings();
      await loadProjectInvites();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fill team.";
      toast.error("Fill team failed", message);
    } finally {
      setIsFillingTeam(false);
    }
  };

  const handleGenerateTasks = async () => {
    if (!projectId || !isMember) {
      return;
    }

    setIsGeneratingTasks(true);
    try {
      const tasks = await aiGenerateProjectTasks(projectId, repoAnalysisSummary);
      toast.success("Tasks generated", `${tasks.length} task(s) created by AI.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate AI tasks.";
      toast.error("Task generation failed", message);
    } finally {
      setIsGeneratingTasks(false);
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
        assignedMemberId: newTaskAssignee,
      });
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskAssignee(undefined);
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

  const handleReassignTask = async (taskId: string, assignedMemberId?: string) => {
    if (!projectId || !isMember || project?.status === "completed") {
      return;
    }

    setReassigningTaskId(taskId);
    try {
      await reassignProjectTask(projectId, taskId, assignedMemberId);
      toast.success("Task updated", "Task assignee has been updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reassign task.";
      toast.error("Task update failed", message);
    } finally {
      setReassigningTaskId(null);
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

  const handleDeleteProject = async () => {
    if (!projectId || !project) {
      return;
    }

    setIsDeletingProject(true);
    try {
      await deleteProject(projectId);
      toast.success("Project deleted", "The project has been permanently deleted.");
      router.push("/app/projects");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete project.";
      toast.error("Delete failed", message);
    } finally {
      setIsDeletingProject(false);
    }
  };

  const openRemoveMemberModal = (member: { id: string; name: string }) => {
    setRemoveMemberTarget(member);
    setRemoveMemberReason("");
  };

  const handleRemoveMember = async () => {
    if (!projectId || !removeMemberTarget) {
      return;
    }

    const reason = removeMemberReason.trim();
    if (!reason) {
      toast.error("Reason required", "Provide a reason for removing this member.");
      return;
    }

    setIsRemovingMember(true);
    try {
      await removeProjectMember(projectId, removeMemberTarget.id, reason);
      toast.success(
        "Member removed",
        `${removeMemberTarget.name} has been removed from this project.`,
      );
      setRemoveMemberTarget(null);
      setRemoveMemberReason("");
      await loadMeetings();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove member.";
      toast.error("Remove failed", message);
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleSubmitComplaint = async () => {
    if (!projectId) {
      return;
    }

    const complaint = complaintInput.trim();
    if (!complaint) {
      toast.error("Complaint required", "Please provide complaint details.");
      return;
    }

    setIsSubmittingComplaint(true);
    try {
      await submitProjectComplaint(projectId, complaint);
      toast.success("Complaint logged", "Project lead has received your complaint.");
      setIsComplaintOpen(false);
      setComplaintInput("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit complaint.";
      toast.error("Complaint failed", message);
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const executeJoinProject = async (confirmHighWorkload = false) => {
    if (!projectId) return;

    setIsJoiningProject(true);
    try {
      await joinProject(projectId, confirmHighWorkload);
      await Promise.all([fetchMyProjects(), fetchProjectById(projectId)]);
      await loadMeetings();
      toast.success("Joined project", "You are now a member of this project.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to join project.";
      toast.error("Join failed", message);
    } finally {
      setIsJoiningProject(false);
    }
  };

  const handleJoinProject = async () => {
    if (!projectId) return;

    setIsJoiningProject(true);
    try {
      const warning = await getJoinProjectLoadWarning(projectId);
      if (warning?.shouldWarn) {
        setIsJoiningProject(false);
        setJoinWarning(warning);
        return;
      }

      await executeJoinProject(false);
    } catch (error) {
      setIsJoiningProject(false);
      const message =
        error instanceof Error ? error.message : "Failed to evaluate workload.";
      toast.error("Join blocked", message);
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    if (!projectId) {
      return;
    }

    setInviteActionTargetId(inviteId);
    try {
      await acceptProjectInvite(projectId, inviteId);
      await Promise.all([fetchMyProjects(), fetchProjectById(projectId)]);
      await loadProjectInvites();
      toast.success("Invite accepted", "You have joined the project.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to accept invite.";
      toast.error("Accept invite failed", message);
    } finally {
      setInviteActionTargetId(null);
    }
  };

  const handleRejectInvite = async (inviteId: string) => {
    if (!projectId) {
      return;
    }

    setInviteActionTargetId(inviteId);
    try {
      await rejectProjectInvite(projectId, inviteId);
      await loadProjectInvites();
      toast.success("Invite declined", "You declined the project invite.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reject invite.";
      toast.error("Reject invite failed", message);
    } finally {
      setInviteActionTargetId(null);
    }
  };

  const handleLeaveProject = async () => {
    if (!projectId || !isMember) {
      return;
    }

    const reason = leaveReason.trim();
    if (!reason) {
      toast.error("Reason required", "Tell us why you are leaving this project.");
      return;
    }

    setIsLeaving(true);
    try {
      await leaveProject(projectId, reason);
      setIsLeaveOpen(false);
      setLeaveReason("");
      toast.success("You left the project", "The lead has been notified.");
      router.push("/app/projects");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to leave project.";
      toast.error("Leave failed", message);
    } finally {
      setIsLeaving(false);
    }
  };

  const handleAssignMemberRole = async (
    memberId: string,
    role: "lead" | "member",
  ) => {
    if (!projectId || !canManageMemberRoles) {
      return;
    }

    setRoleUpdateMemberId(memberId);
    try {
      await assignMemberRole(projectId, memberId, role);
      toast.success("Role updated", "Project member role has been updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update member role.";
      toast.error("Role update failed", message);
    } finally {
      setRoleUpdateMemberId(null);
    }
  };

  const handleSetMentor = async (memberId: string, isMentor: boolean) => {
    if (!projectId || !canManageMemberRoles) return;
    setRoleUpdateMemberId(memberId);
    try {
      await setProjectMemberMentor(projectId, memberId, isMentor);
      toast.success(isMentor ? "Mentor enabled" : "Mentor removed", "Project review permissions were updated.");
    } catch (error) {
      toast.error("Mentor update failed", error instanceof Error ? error.message : "Try again.");
    } finally { setRoleUpdateMemberId(null); }
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

  const handleRequestMeeting = async () => {
    if (!projectId) {
      return;
    }

    if (!requestMeetingTitle.trim() || !requestMeetingRange) {
      toast.error("Missing fields", "Title, start and end time are required.");
      return;
    }

    setIsSavingMeeting(true);
    try {
      await requestProjectMeeting(projectId, {
        title: requestMeetingTitle.trim(),
        agenda: requestMeetingAgenda.trim(),
        startsAtUtc: requestMeetingRange[0].toISOString(),
        endsAtUtc: requestMeetingRange[1].toISOString(),
      });
      setIsRequestMeetingOpen(false);
      setRequestMeetingTitle("");
      setRequestMeetingAgenda("");
      setRequestMeetingRange(null);
      await loadMeetings();
      toast.success("Meeting requested", "Project leads can now schedule it.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to request meeting.";
      toast.error("Request failed", message);
    } finally {
      setIsSavingMeeting(false);
    }
  };

  const openScheduleModal = (meeting: IProjectMeeting) => {
    setScheduleMeetingTarget(meeting);
    setScheduleMeetingTitle(meeting.title);
    setScheduleMeetingAgenda(meeting.agenda ?? "");
    setScheduleMeetingStart(toLocalDateTimeInput(meeting.startsAtUtc));
    setScheduleMeetingEnd(toLocalDateTimeInput(meeting.endsAtUtc));
    setScheduleMeetingRoom(meeting.jitsiRoomName ?? "");
  };

  const handleScheduleMeeting = async () => {
    if (!projectId || !scheduleMeetingTarget) {
      return;
    }

    if (!scheduleMeetingTitle.trim() || !scheduleMeetingStart || !scheduleMeetingEnd) {
      toast.error("Missing fields", "Title, start and end time are required.");
      return;
    }

    setIsSavingMeeting(true);
    try {
      await scheduleProjectMeeting(projectId, scheduleMeetingTarget.id, {
        title: scheduleMeetingTitle.trim(),
        agenda: scheduleMeetingAgenda.trim(),
        startsAtUtc: localInputToIso(scheduleMeetingStart),
        endsAtUtc: localInputToIso(scheduleMeetingEnd),
        jitsiRoomName: scheduleMeetingRoom.trim(),
      });
      setScheduleMeetingTarget(null);
      await loadMeetings();
      toast.success("Meeting scheduled", "Members can join via Jitsi.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to schedule meeting.";
      toast.error("Schedule failed", message);
    } finally {
      setIsSavingMeeting(false);
    }
  };

  const handleSaveReminder = async (meetingId: string) => {
    if (!projectId) {
      return;
    }

    const draft = meetingReminderDraft[meetingId];
    if (!draft) {
      return;
    }

    try {
      await setProjectMeetingReminder(
        projectId,
        meetingId,
        Number(draft.minutesBefore),
        Boolean(draft.enabled),
      );
      await loadMeetings();
      toast.success("Reminder saved", "Meeting reminder preference updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save reminder.";
      toast.error("Reminder failed", message);
    }
  };

  const handleCancelMeeting = async (meetingId: string) => {
    if (!projectId) {
      return;
    }

    try {
      await cancelProjectMeeting(projectId, meetingId);
      await loadMeetings();
      toast.success("Meeting cancelled", "The meeting has been cancelled.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to cancel meeting.";
      toast.error("Cancel failed", message);
    }
  };

  const projectViewState = resolveProjectDetailViewState({
    isProjectLoading,
    projectId,
    project,
  });

  if (projectViewState === "loading") {
    return (
      <div className={styles.projectLoading}>
        <Card className={styles.projectLoadingCard}>
          <Skeleton active title paragraph={{ rows: 3 }} />
          <Skeleton active title={false} paragraph={{ rows: 5 }} />
        </Card>
      </div>
    );
  }

  if (projectViewState === "not-found") {
    return <NotFound />;
  }

  if (!project || project.id !== projectId) {
    return <NotFound />;
  }

  const tabLabel = (icon: ReactNode, fullLabel: string, shortLabel: string) => (
    <span className={styles.tabLabel}>
      <span className={styles.tabIcon}>{icon}</span>
      <span className={styles.tabLabelFull}>{fullLabel}</span>
      <span className={styles.tabLabelShort}>{shortLabel}</span>
    </span>
  );

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
        <div className={styles.headerContent}>
          {project.status !== "completed" ? (
            <div className={styles.headerPrimaryActions}>
              <Space wrap>
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
                {currentMember?.id === project.ownerId ? (
                  <Popover
                    trigger="hover"
                    content={
                      !canDeleteProject
                        ? "Remove other members first. You can only delete when you are the only member."
                        : null
                    }
                  >
                    <span>
                      <Button
                        danger
                        disabled={!canDeleteProject}
                        loading={isDeletingProject}
                        onClick={() => void handleDeleteProject()}
                        data-ai-action="delete-project"
                      >
                        Delete Project
                      </Button>
                    </span>
                  </Popover>
                ) : null}
              </Space>
            </div>
          ) : null}
          <div className={styles.titleRow}>
            <Typography.Title level={2} style={{ margin: 0 }}>
              {project.title}
            </Typography.Title>
            <Tag color={statusColor(project.status)}>{project.status}</Tag>
          </div>
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
              <Space wrap>
                {!isMember && project.status === "open" ? (
                  currentUserInvite ? (
                    <Space wrap>
                      <Button
                        type="primary"
                        loading={inviteActionTargetId === currentUserInvite.id}
                        onClick={() => void handleAcceptInvite(currentUserInvite.id)}
                      >
                        Accept Invite
                      </Button>
                      <Button
                        danger
                        loading={inviteActionTargetId === currentUserInvite.id}
                        onClick={() => void handleRejectInvite(currentUserInvite.id)}
                      >
                        Reject Invite
                      </Button>
                    </Space>
                  ) : (
                    <Button
                      type="primary"
                      onClick={handleJoinProject}
                      loading={isJoiningProject}
                      disabled={isJoiningProject}
                      data-ai-action="join-project"
                    >
                      Join Project
                    </Button>
                  )
                ) : null}

              {canLogComplaint ? (
                <Button onClick={() => setIsComplaintOpen(true)}>
                  Log Complaint
                </Button>
              ) : null}
            </Space>
          </div>
        ) : null}
      </motion.div>

      <Tabs
        type="card"
        className={styles.tabs}
        activeKey={activeTab}
        onChange={setActiveTab}
        tabBarGutter={6}
        items={[
          { key: "repo-safety", label: tabLabel(<SafetyOutlined />, "Repo Safety", "Safety") },
          { key: "team", label: tabLabel(<TeamOutlined />, "Team", "Team") },
          { key: "progress", label: tabLabel(<FileTextOutlined />, "Progress", "Progress") },
          { key: "spec", label: tabLabel(<FileTextOutlined />, "Project Spec", "Spec") },
          { key: "analysis", label: tabLabel(<BarChartOutlined />, "Repo Analysis", "Analysis") },
          { key: "tasks", label: tabLabel(<CheckSquareOutlined />, "Tasks", "Tasks") },
          { key: "meetings", label: tabLabel(<VideoCameraOutlined />, "Meetings (Jitsi)", "Meetings") },
        ]}
      />

      {activeTab === "repo-safety" ? (
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
      ) : null}

      {activeTab === "team" ? (
        <Card
          title={
            <div className={styles.teamHeader}>
              <Space>
                <Users size={16} />
                Team ({project.members.length}/{project.maxMembers})
              </Space>
              {project.status !== "completed" ? (
                <Space wrap>
                  {isMember && availableMemberSpots > 0 ? (
                    <Button
                      onClick={handleFillTeam}
                      loading={isFillingTeam}
                      icon={
                        isFillingTeam ? <Loader2 size={14} /> : <Sparkles size={14} />
                      }
                      data-ai-action="ai-fill-team"
                    >
                      AI Fill Team (Invite)
                    </Button>
                  ) : null}
                  {isMember ? (
                    <Button
                      danger
                      onClick={() => setIsLeaveOpen(true)}
                      data-ai-action="open-leave-project"
                    >
                      Leave Project
                    </Button>
                  ) : null}
                </Space>
              ) : null}
            </div>
          }
          className={styles.membersCard}
        >
          <Space direction="vertical" size="small" className={styles.fullWidth}>
            {project.members.map((member) => {
              const isYou =
                (member.userName ?? "").toLowerCase() ===
                (currentUser?.userName ?? "").toLowerCase();
              const isOwnerMember = member.id === project.ownerId;
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
                  {canManageMemberRoles ? (
                    <>
                    <Select<"lead" | "member">
                      size="small"
                      value={member.role}
                      loading={roleUpdateMemberId === member.id}
                      disabled={roleUpdateMemberId !== null}
                      onChange={(nextRole) => {
                        void handleAssignMemberRole(member.id, nextRole);
                      }}
                      options={[
                        { label: "Lead", value: "lead" },
                        { label: "Member", value: "member" },
                      ]}
                      className={styles.memberRoleSelect}
                    />
                    <Button size="small" loading={roleUpdateMemberId === member.id} disabled={roleUpdateMemberId !== null} onClick={() => void handleSetMentor(member.id, !member.isMentor)}>{member.isMentor ? "Remove mentor" : "Set mentor"}</Button>
                    </>
                  ) : null}
                  {canManageMemberRoles && !isYou && !isOwnerMember ? (
                    <Button
                      size="small"
                      danger
                      onClick={() =>
                        openRemoveMemberModal({ id: member.id, name: member.name })
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                  {isYou ? <Badge color="gold" text="You" /> : null}
                </div>
              );
            })}

            {pendingInvites.length > 0 ? (
              <div className={styles.invitesSection}>
                <Typography.Text strong>
                  Invited ({pendingInvites.length})
                </Typography.Text>
                {isInvitesLoading ? (
                  <Spin size="small" />
                ) : (
                  <Space direction="vertical" size="small" className={styles.fullWidth}>
                    {pendingInvites.map((invite) => {
                      const isCurrentUserInvite =
                        (invite.developerUserName ?? "").toLowerCase() ===
                        (currentUser?.userName ?? "").toLowerCase();
                      return (
                        <div className={styles.inviteItem} key={invite.id}>
                          <div className={styles.memberMeta}>
                            <Typography.Text ellipsis>
                              {invite.developerName}
                            </Typography.Text>
                            <Typography.Text
                              type="secondary"
                              style={{ display: "block" }}
                            >
                              Invited by {invite.invitedByDeveloperName}
                            </Typography.Text>
                          </div>
                          <Tag color="gold">Pending</Tag>
                          {isCurrentUserInvite ? (
                            <Space size="small" wrap>
                              <Button
                                size="small"
                                type="primary"
                                loading={inviteActionTargetId === invite.id}
                                onClick={() => void handleAcceptInvite(invite.id)}
                              >
                                Accept
                              </Button>
                              <Button
                                size="small"
                                danger
                                loading={inviteActionTargetId === invite.id}
                                onClick={() => void handleRejectInvite(invite.id)}
                              >
                                Reject
                              </Button>
                            </Space>
                          ) : null}
                        </div>
                      );
                    })}
                  </Space>
                )}
              </div>
            ) : null}

            {availableMemberSpots > 0 ? (
              <div className={styles.openSpots}>
                {availableMemberSpots} spots available
              </div>
            ) : null}
          </Space>
        </Card>
      ) : null}

      {activeTab === "progress" ? (
        <ProjectProgress
          projectId={project.id}
          developerId={project.members.find((member) => member.userName?.toLowerCase() === currentUser?.userName?.toLowerCase())?.id}
          canReview={isMember}
        />
      ) : null}

      {activeTab === "spec" ? (
        <Card title="Project Specification">
          <div className={styles.description}>
            <MDEditor.Markdown
              source={project.description || ""}
              data-color-mode={mode}
              className={styles.markdownBody}
            />
          </div>
        </Card>
      ) : null}

      {activeTab === "analysis" ? (
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
      ) : null}

      {activeTab === "tasks" ? (
        <Card
          title={
            <div className={styles.taskHeader}>
              <Typography.Text strong>Tasks</Typography.Text>
              {isMember && project.status !== "completed" ? (
                <Space wrap>
                  <Button
                    type="primary"
                    icon={<Plus size={14} />}
                    onClick={() => setIsAddTaskOpen(true)}
                    data-ai-action="open-add-project-task"
                  >
                    Add Task
                  </Button>
                  <Button
                    icon={<Sparkles size={14} />}
                    loading={isGeneratingTasks}
                    onClick={() => void handleGenerateTasks()}
                  >
                    AI Generate Tasks
                  </Button>
                  <Button size="small" onClick={handleOpenSkillsEditor}>
                    Update Skills
                  </Button>
                </Space>
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
                                  {task.assignedMemberName ? (
                                    <Tag color="blue">Assigned: {task.assignedMemberName}</Tag>
                                  ) : (
                                    <Tag>Unassigned</Tag>
                                  )}
                                  {isMember && project.status !== "completed" ? (
                                    <Select
                                      size="small"
                                      className={styles.taskAssigneeSelect}
                                      value={task.assignedMemberId || "__unassigned__"}
                                      loading={reassigningTaskId === task.id}
                                      onChange={(value) => {
                                        const nextAssigneeId =
                                          value === "__unassigned__"
                                            ? undefined
                                            : String(value);
                                        if (
                                          (task.assignedMemberId || undefined) ===
                                          nextAssigneeId
                                        ) {
                                          return;
                                        }

                                        void handleReassignTask(task.id, nextAssigneeId);
                                      }}
                                      options={[
                                        { value: "__unassigned__", label: "Unassigned" },
                                        ...project.members.map((member) => ({
                                          value: member.id,
                                          label: member.name,
                                        })),
                                      ]}
                                    />
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
      ) : null}

      {activeTab === "meetings" ? (
        <Card
          title={
            <div className={styles.taskHeader}>
              <Typography.Text strong>Meetings</Typography.Text>
              {isMember ? (
                <Button
                  icon={<Video size={14} />}
                  onClick={() => setIsRequestMeetingOpen(true)}
                >
                  Request Meeting
                </Button>
              ) : null}
            </div>
          }
        >
          {!isMember ? (
            <Typography.Text type="secondary">
              Join the project to access meetings.
            </Typography.Text>
          ) : isMeetingsLoading ? (
            <Spin />
          ) : meetings.length === 0 ? (
            <Typography.Text type="secondary">
              No meetings yet. Request one to start collaboration.
            </Typography.Text>
          ) : (
            <div className={styles.meetingsList}>
              {meetings.map((meeting) => {
                const reminderDraft = meetingReminderDraft[meeting.id] ?? {
                  minutesBefore: meeting.reminderMinutesBefore,
                  enabled: meeting.reminderEnabled,
                };
                const canJoin =
                  meeting.status === "scheduled" && Boolean(meeting.jitsiRoomName);

                return (
                  <div key={meeting.id} className={styles.meetingCard}>
                    <div className={styles.meetingHeader}>
                      <Space wrap>
                        <Typography.Text strong>{meeting.title}</Typography.Text>
                        <Tag color={meetingStatusColor(meeting.status)}>
                          {meeting.status}
                        </Tag>
                      </Space>
                      <Space wrap>
                        {canJoin ? (
                          <a
                            href={`https://meet.jit.si/${meeting.jitsiRoomName}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button type="primary" icon={<Video size={14} />}>
                              Join Jitsi
                            </Button>
                          </a>
                        ) : null}
                        {canManageMeetings && meeting.status === "requested" ? (
                          <Button onClick={() => openScheduleModal(meeting)}>
                            Schedule
                          </Button>
                        ) : null}
                        {canManageMeetings && meeting.status === "scheduled" ? (
                          <Button danger onClick={() => void handleCancelMeeting(meeting.id)}>
                            Cancel
                          </Button>
                        ) : null}
                      </Space>
                    </div>
                    <Typography.Text className={styles.meetingMeta}>
                      {new Date(meeting.startsAtUtc).toLocaleString()} -{" "}
                      {new Date(meeting.endsAtUtc).toLocaleString()}
                    </Typography.Text>
                    <Typography.Text className={styles.meetingMeta}>
                      Requested by {meeting.requestedByMemberName}
                    </Typography.Text>
                    {meeting.agenda ? (
                      <Typography.Paragraph>{meeting.agenda}</Typography.Paragraph>
                    ) : null}
                    <div className={styles.reminderRow}>
                      <Typography.Text type="secondary">Reminder:</Typography.Text>
                      <Select
                        size="small"
                        value={reminderDraft.minutesBefore}
                        options={[
                          { value: 5, label: "5 min" },
                          { value: 15, label: "15 min" },
                          { value: 30, label: "30 min" },
                          { value: 60, label: "60 min" },
                        ]}
                        onChange={(value) => {
                          setMeetingReminderDraft((prev) => ({
                            ...prev,
                            [meeting.id]: {
                              ...reminderDraft,
                              minutesBefore: Number(value),
                            },
                          }));
                        }}
                      />
                      <Switch
                        size="small"
                        checked={Boolean(reminderDraft.enabled)}
                        onChange={(checked) => {
                          setMeetingReminderDraft((prev) => ({
                            ...prev,
                            [meeting.id]: {
                              ...reminderDraft,
                              enabled: checked,
                            },
                          }));
                        }}
                      />
                      <Button size="small" onClick={() => void handleSaveReminder(meeting.id)}>
                        Save Reminder
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ) : null}

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
          <Select
            allowClear
            value={newTaskAssignee}
            onChange={(value) => setNewTaskAssignee(value)}
            placeholder="Assign to member (optional)"
            options={project.members.map((member) => ({
              value: member.id,
              label: member.name,
            }))}
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

      <Modal
        title="Leave Project"
        open={isLeaveOpen}
        confirmLoading={isLeaving}
        onCancel={() => setIsLeaveOpen(false)}
        onOk={handleLeaveProject}
        okText="Leave Project"
        okButtonProps={{ danger: true, "data-ai-action": "submit-leave-project" }}
      >
        <div className={styles.modalBody}>
          <Typography.Text>
            Why are you leaving this project? Your feedback helps the lead improve team health.
          </Typography.Text>
          <Input.TextArea
            rows={4}
            value={leaveReason}
            onChange={(event) => setLeaveReason(event.target.value)}
            placeholder="Example: Current workload changed and I can no longer commit enough time."
            data-ai-field="leave-project-reason"
          />
        </div>
      </Modal>

      <Modal
        title="Remove Member"
        open={Boolean(removeMemberTarget)}
        confirmLoading={isRemovingMember}
        onCancel={() => {
          setRemoveMemberTarget(null);
          setRemoveMemberReason("");
        }}
        onOk={() => void handleRemoveMember()}
        okText="Remove Member"
        okButtonProps={{ danger: true }}
      >
        <div className={styles.modalBody}>
          <Typography.Text>
            Why are you removing {removeMemberTarget?.name ?? "this member"} from the project?
          </Typography.Text>
          <Input.TextArea
            rows={4}
            value={removeMemberReason}
            onChange={(event) => setRemoveMemberReason(event.target.value)}
            placeholder="Provide clear project context for this decision."
          />
        </div>
      </Modal>

      <Modal
        title="Log Complaint To Lead"
        open={isComplaintOpen}
        confirmLoading={isSubmittingComplaint}
        onCancel={() => {
          setIsComplaintOpen(false);
          setComplaintInput("");
        }}
        onOk={() => void handleSubmitComplaint()}
        okText="Submit Complaint"
      >
        <div className={styles.modalBody}>
          <Typography.Text>
            Share your concern. This will be sent directly to project lead(s).
          </Typography.Text>
          <Input.TextArea
            rows={5}
            value={complaintInput}
            onChange={(event) => setComplaintInput(event.target.value)}
            placeholder="Describe what happened and what support you need."
          />
        </div>
      </Modal>

      <Modal
        open={Boolean(joinWarning)}
        title="Workload Warning"
        onCancel={() => setJoinWarning(null)}
        footer={[
          <Button key="cancel" type="primary" onClick={() => setJoinWarning(null)}>
            Cancel
          </Button>,
          <Button
            key="continue"
            onClick={() => {
              setJoinWarning(null);
              void executeJoinProject(true);
            }}
          >
            Continue Anyway
          </Button>,
        ]}
      >
        <Typography.Paragraph>{joinWarning?.message}</Typography.Paragraph>
        <Typography.Text type="secondary">
          Active projects: {joinWarning?.activeProjects ?? 0} /{" "}
          {joinWarning?.recommendedProjectLimit ?? 0}
        </Typography.Text>
        <br />
        <Typography.Text type="secondary">
          Workload score if you join: {joinWarning?.proposedWorkloadScore ?? 0} /{" "}
          {joinWarning?.recommendedWorkloadLimit ?? 0}
        </Typography.Text>
      </Modal>

      <Modal open={isJoiningProject} footer={null} closable={false} maskClosable={false} keyboard={false}>
        <div className={styles.joiningModalBody}>
          <Spin size="large" />
          <Typography.Title level={4} className={styles.joiningTitle}>
            Joining project
          </Typography.Title>
          <Typography.Text type="secondary">
            Please wait while we secure your project membership.
          </Typography.Text>
        </div>
      </Modal>

      <Modal
        title="Request Meeting"
        open={isRequestMeetingOpen}
        confirmLoading={isSavingMeeting}
        onCancel={() => {
          setIsRequestMeetingOpen(false);
          setRequestMeetingRange(null);
        }}
        onOk={() => void handleRequestMeeting()}
        okText="Request"
      >
        <div className={styles.modalBody}>
          <Input
            value={requestMeetingTitle}
            onChange={(event) => setRequestMeetingTitle(event.target.value)}
            placeholder="Meeting title"
          />
          <Input.TextArea
            rows={3}
            value={requestMeetingAgenda}
            onChange={(event) => setRequestMeetingAgenda(event.target.value)}
            placeholder="Agenda"
          />
          <DatePicker.RangePicker
            showTime
            className={styles.fullWidth}
            value={requestMeetingRange}
            onChange={(value) => {
              if (!value || !value[0] || !value[1]) {
                setRequestMeetingRange(null);
                return;
              }
              setRequestMeetingRange([value[0], value[1]]);
            }}
          />
        </div>
      </Modal>

      <Modal
        title="Schedule Meeting"
        open={Boolean(scheduleMeetingTarget)}
        confirmLoading={isSavingMeeting}
        onCancel={() => setScheduleMeetingTarget(null)}
        onOk={() => void handleScheduleMeeting()}
        okText="Schedule"
      >
        <div className={styles.modalBody}>
          <Input
            value={scheduleMeetingTitle}
            onChange={(event) => setScheduleMeetingTitle(event.target.value)}
            placeholder="Meeting title"
          />
          <Input.TextArea
            rows={3}
            value={scheduleMeetingAgenda}
            onChange={(event) => setScheduleMeetingAgenda(event.target.value)}
            placeholder="Agenda"
          />
          <Input
            placeholder="Jitsi room name (optional)"
            value={scheduleMeetingRoom}
            onChange={(event) => setScheduleMeetingRoom(event.target.value)}
          />
          <Input
            type="datetime-local"
            value={scheduleMeetingStart}
            onChange={(event) => setScheduleMeetingStart(event.target.value)}
          />
          <Input
            type="datetime-local"
            value={scheduleMeetingEnd}
            onChange={(event) => setScheduleMeetingEnd(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;

