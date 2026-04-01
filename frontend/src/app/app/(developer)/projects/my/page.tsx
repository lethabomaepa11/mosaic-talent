"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Alert,
  AutoComplete,
  Button,
  Card,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Typography,
} from "antd";
import { FolderKanban, Plus, Sparkles } from "lucide-react";
import { toast } from "@/components/providers";
import { ProjectCard } from "@/components/project-card/ProjectCard";
import { useDeveloperAction } from "@/providers/developer-provider";
import { useProjectAction, useProjectState } from "@/providers/project-provider";
import { IRepoSafetyResult } from "@/providers/project-provider/context";
import { isRepoSafetyUnsafe } from "@/utils/repoSafety";
import { useStyles } from "./style";

const MyProjectsPage = () => {
  const [form] = Form.useForm();
  const [repoForm] = Form.useForm();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isGithubStatusLoading, setIsGithubStatusLoading] = useState(false);
  const [isRepoCreateOpen, setIsRepoCreateOpen] = useState(false);
  const [isRepoCreating, setIsRepoCreating] = useState(false);
  const [isRepoSafetyChecking, setIsRepoSafetyChecking] = useState(false);
  const [repoSafetyError, setRepoSafetyError] = useState("");
  const [repoSafetyResult, setRepoSafetyResult] = useState<IRepoSafetyResult | undefined>(
    undefined,
  );
  const [githubConnection, setGithubConnection] = useState({
    isConnected: false,
    githubUsername: "",
  });
  const [githubRepos, setGithubRepos] = useState<
    Array<{
      fullName: string;
      name: string;
      isPrivate: boolean;
    }>
  >([]);
  const router = useRouter();

  const { styles } = useStyles();
  const { fetchCurrentUser } = useDeveloperAction();
  const { myProjects } = useProjectState();
  const {
    fetchMyProjects,
    fetchOpenProjects,
    getGithubConnectionStatus,
    getMyGithubRepositories,
    createGithubRepository,
    createProject,
    scanRepoSafetyByGithubUrl,
    aiMatchProject,
  } = useProjectAction();
  const selectedGithubRepo = Form.useWatch("githubRepo", form);

  const githubConnectUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TokenAuth/GitHubAuth?mode=connect&returnPath=${encodeURIComponent("/projects/my?create=true")}`
    : "";

  useEffect(() => {
    fetchCurrentUser();
    fetchMyProjects();
    fetchOpenProjects();
  }, []);

  const clearRepoSafetyState = useCallback(() => {
    setRepoSafetyError("");
    setRepoSafetyResult(undefined);
    setIsRepoSafetyChecking(false);
  }, []);

  const loadGithubContext = async () => {
    setIsGithubLoading(true);
    setIsGithubStatusLoading(true);

    try {
      const status = await getGithubConnectionStatus();
      setGithubConnection(status);
      setIsGithubStatusLoading(false);

      if (!status.isConnected) {
        setGithubRepos([]);
        form.setFieldValue("githubRepo", undefined);
        clearRepoSafetyState();
        return;
      }

      const repositories = await getMyGithubRepositories();
      setGithubRepos(repositories);

      const selectedRepo = form.getFieldValue("githubRepo");
      if (!selectedRepo && repositories.length > 0) {
        form.setFieldValue(
          "githubRepo",
          repositories[0]?.fullName || repositories[0]?.name,
        );
      }
    } catch (error) {
      setIsGithubStatusLoading(false);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load GitHub repositories.";
      toast.error("GitHub unavailable", message);
    } finally {
      setIsGithubLoading(false);
    }
  };

  const resolveSelectedRepoUrl = useCallback((value: string) => {
    const selected = githubRepos.find((repo) => {
      const repoKey = repo.fullName || repo.name;
      return repoKey === value;
    });

    if (selected?.fullName) {
      return `https://github.com/${selected.fullName}`;
    }

    if (value.startsWith("https://github.com/")) {
      return value;
    }

    return "";
  }, [githubRepos]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("create") === "true") {
      setIsCreateOpen(true);
      void loadGithubContext();
    }

    if (params.get("match") === "true") {
      void handleAIMatch();
    }

    const isGithubConnected = params.get("githubConnected");
    const githubConnectError = params.get("githubConnectError");
    if (isGithubConnected === "1") {
      toast.success(
        "GitHub connected",
        "Your GitHub account is now connected for project creation.",
      );
    }
    if (isGithubConnected === "0" && githubConnectError) {
      toast.error("GitHub connect failed", githubConnectError);
    }

    if (isGithubConnected !== null || githubConnectError !== null) {
      params.delete("githubConnected");
      params.delete("githubConnectError");
      const query = params.toString();
      const nextUrl = query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;
      window.history.replaceState({}, "", nextUrl);
    }
  }, []);

  useEffect(() => {
    if (!isCreateOpen || !githubConnection.isConnected) {
      return;
    }

    if (!selectedGithubRepo) {
      clearRepoSafetyState();
      return;
    }

    const selectedUrl = resolveSelectedRepoUrl(String(selectedGithubRepo));
    if (!selectedUrl) {
      setRepoSafetyResult(undefined);
      setRepoSafetyError("Select a repository from the list to run safety checks.");
      return;
    }

    let isActive = true;
    setIsRepoSafetyChecking(true);
    setRepoSafetyError("");
    setRepoSafetyResult(undefined);

    scanRepoSafetyByGithubUrl(selectedUrl)
      .then((scan) => {
        if (!isActive) {
          return;
        }

        setRepoSafetyResult(scan?.result);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setRepoSafetyResult(undefined);
        setRepoSafetyError(
          error instanceof Error
            ? error.message
            : "Repository safety scan failed.",
        );
      })
      .finally(() => {
        if (isActive) {
          setIsRepoSafetyChecking(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    clearRepoSafetyState,
    githubConnection.isConnected,
    isCreateOpen,
    resolveSelectedRepoUrl,
    scanRepoSafetyByGithubUrl,
    selectedGithubRepo,
  ]);

  const handleAIMatch = async () => {
    setIsMatching(true);
    try {
      const matched = await aiMatchProject();
      if (matched) {
        toast.success("Match found", `Best match: "${matched.title}".`);
        router.push(`/app/projects/${matched.id}?from=ai-match`);
      } else {
        toast.info("No matches", "No matching open projects found.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI matching failed.";
      toast.error("Match failed", message);
    } finally {
      setIsMatching(false);
    }
  };

  const openCreateModal = async () => {
    setIsCreateOpen(true);
    await loadGithubContext();
  };

  const handleConnectGithub = () => {
    if (!githubConnectUrl) {
      toast.error(
        "GitHub auth unavailable",
        "Configure NEXT_PUBLIC_API_BASE_URL first.",
      );
      return;
    }

    window.location.href = githubConnectUrl;
  };

  const handleCreateRepository = async () => {
    try {
      const values = await repoForm.validateFields();
      setIsRepoCreating(true);
      const created = await createGithubRepository({
        name: values.name,
        description: values.description,
        isPrivate: Boolean(values.isPrivate),
      });

      await loadGithubContext();
      if (created) {
        form.setFieldValue("githubRepo", created.fullName || created.name);
      }
      repoForm.resetFields();
      setIsRepoCreateOpen(false);
      toast.success("Repository created", "New GitHub repository is ready.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create GitHub repository.";
      toast.error("Repository creation failed", message);
    } finally {
      setIsRepoCreating(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const values = await form.validateFields();
      setIsCreating(true);
      const selectedRepoUrl = resolveSelectedRepoUrl(String(values.githubRepo ?? ""));
      const isUnsafeSelection = isRepoSafetyUnsafe(repoSafetyResult);

      if (isRepoSafetyChecking) {
        throw new Error("Repository safety scan is still running. Please wait.");
      }

      if (!selectedRepoUrl) {
        throw new Error("Select a repository from the list to run safety checks.");
      }

      if (!repoSafetyResult) {
        throw new Error("Repository safety check is required before project creation.");
      }

      if (isUnsafeSelection) {
        throw new Error(
          "This repository cannot be added because the safety scan detected potentially malicious code.",
        );
      }

      await createProject({
        title: values.title,
        description: values.description,
        maxMembers: values.maxMembers,
        githubRepo: values.githubRepo,
        skills: String(values.skills ?? "")
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        type: Number(values.type),
        status: Number(values.status),
      });

      toast.success("Project created", "Your project has been created.");
      form.resetFields();
      setIsCreateOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create project.";
      toast.error("Create failed", message);
    } finally {
      setIsCreating(false);
    }
  };

  const repoOptions = githubRepos.map((repo) => {
    const repoKey = repo.fullName || repo.name;
    return {
      value: repoKey,
      label: `${repoKey}${repo.isPrivate ? " (private)" : ""}`,
    };
  });
  const isUnsafeRepo = isRepoSafetyUnsafe(repoSafetyResult);

  return (
    <div className={styles.page} data-ai-page="projects-my">
      <motion.div
        className={styles.header}
        initial={false}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <Typography.Title level={2} className={styles.title}>
            My Projects
          </Typography.Title>
          <Typography.Paragraph className={styles.subtitle}>
            Manage your active projects and jump into delivery work.
          </Typography.Paragraph>
        </div>
        <div className={styles.actionRow}>
          <Link href="/app/projects/open">
            <Button>Browse Open Projects</Button>
          </Link>
          <Button onClick={handleAIMatch} loading={isMatching} icon={<Sparkles size={14} />} data-ai-action="ai-match-project">
            AI Match Me
          </Button>
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={() => void openCreateModal()}
            data-ai-action="open-create-project"
          >
            New Project
          </Button>
        </div>
      </motion.div>

      {myProjects.length === 0 ? (
        <Card className={styles.emptyCard}>
          <Empty
            image={<FolderKanban size={48} />}
            description="No projects yet. Create one or let AI match you."
          />
        </Card>
      ) : (
        <div className={styles.projectGrid}>
          {myProjects.map((project) => (
            <ProjectCard key={project.id} project={project} isMember />
          ))}
        </div>
      )}

      <AnimatePresence>
        {isMatching ? (
          <motion.div
            className={styles.matchingOverlay}
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.matchingContent}
              initial={false}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className={styles.matchingDot}>
                <Spin size="large" />
              </div>
              <Typography.Title level={4}>Finding your perfect match...</Typography.Title>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Modal
        title="Create New Project"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onOk={handleCreateProject}
        confirmLoading={isCreating}
        okText="Create Project"
        okButtonProps={{
          "data-ai-action": "submit-create-project",
          disabled:
            isGithubStatusLoading ||
            !githubConnection.isConnected ||
            isGithubLoading ||
            isRepoSafetyChecking ||
            isUnsafeRepo ||
            (Boolean(selectedGithubRepo) && !repoSafetyResult),
        }}
      >
        <Form
          form={form}
          layout="vertical"
          className={styles.formGrid}
          initialValues={{ maxMembers: 4, type: 1, status: 1 }}
        >
          <Form.Item label="Project Title" name="title" rules={[{ required: true }]}> 
            <Input placeholder="E-commerce Dashboard" data-ai-field="project-title" />
          </Form.Item>
          <Form.Item label="Description" name="description" rules={[{ required: true }]}> 
            <Input.TextArea rows={4} placeholder="Describe your project..." data-ai-field="project-description" />
          </Form.Item>
          <Form.Item label="Max Team Members" name="maxMembers" rules={[{ required: true }]}> 
            <InputNumber min={2} max={8} className={styles.fullWidth} />
          </Form.Item>
          {isGithubStatusLoading ? (
            <div className={styles.githubStatusLoader}>
              <Spin size="small" />
              <Typography.Text>Checking GitHub connection...</Typography.Text>
            </div>
          ) : !githubConnection.isConnected ? (
            <Alert
              type="warning"
              message="Connect GitHub to create a project."
              description={
                <Space direction="vertical" size={8}>
                  <Typography.Text>
                    Project creation now requires selecting one of your GitHub repositories.
                  </Typography.Text>
                  <Button onClick={handleConnectGithub} data-ai-action="connect-github-project-create">
                    Connect GitHub
                  </Button>
                </Space>
              }
              showIcon
            />
          ) : (
            <>
              <Form.Item
                label={`GitHub Repository (${githubConnection.githubUsername})`}
                name="githubRepo"
                rules={[
                  { required: true, message: "Select a GitHub repository." },
                  {
                    validator: (_, value) => {
                      if (!value) {
                        return Promise.resolve();
                      }
                      const exists = repoOptions.some((option) => option.value === value);
                      return exists
                        ? Promise.resolve()
                        : Promise.reject(new Error("Choose a repository from suggestions."));
                    },
                  },
                ]}
              >
                <AutoComplete
                  disabled={isGithubLoading}
                  options={repoOptions}
                  filterOption={(inputValue, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(inputValue.toLowerCase())
                  }
                  placeholder="Type to find repository"
                  data-ai-field="project-github-repo"
                />
              </Form.Item>
              <div className={styles.githubActionRow}>
                <Button onClick={() => void loadGithubContext()}>Refresh Repositories</Button>
                <Button
                  onClick={() => setIsRepoCreateOpen(true)}
                  data-ai-action="open-create-github-repo"
                >
                  Create Repository
                </Button>
              </div>
              {githubRepos.length === 0 ? (
                <Alert
                  type="info"
                  showIcon
                  message="No repositories found."
                  description="Create a new repository and it will be auto-selected."
                />
              ) : null}

              {isRepoSafetyChecking ? (
                <Alert
                  type="info"
                  showIcon
                  message="Running repository safety scan..."
                />
              ) : null}
              {!isRepoSafetyChecking && repoSafetyError ? (
                <Alert
                  type="error"
                  showIcon
                  message={repoSafetyError}
                />
              ) : null}
              {!isRepoSafetyChecking && repoSafetyResult && isUnsafeRepo ? (
                <Alert
                  type="error"
                  showIcon
                  message="Repository blocked"
                  description="This repository contains potentially malicious code and cannot be added to a project."
                />
              ) : null}
              {!isRepoSafetyChecking && repoSafetyResult && !isUnsafeRepo ? (
                <Alert
                  type="success"
                  showIcon
                  message="Repository passed safety checks"
                  description="This repository is safe to use for project creation."
                />
              ) : null}
            </>
          )}
          <Form.Item label="You're a match if you have these skills or willing to learn" name="skills">
            <Input placeholder="React, TypeScript, Node.js" />
          </Form.Item>
          <Form.Item label="Project Type" name="type">
            <Select
              options={[
                { label: "Personal", value: 0 },
                { label: "Group", value: 1 },
              ]}
            />
          </Form.Item>
          <Form.Item label="Initial Status" name="status">
            <Select
              options={[
                { label: "Draft", value: 0 },
                { label: "Open", value: 1 },
                { label: "In-Progress", value: 2 },
                { label: "Complete", value: 3 },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Create GitHub Repository"
        open={isRepoCreateOpen}
        onCancel={() => setIsRepoCreateOpen(false)}
        onOk={handleCreateRepository}
        confirmLoading={isRepoCreating}
        okText="Create Repository"
      >
        <Form
          form={repoForm}
          layout="vertical"
          initialValues={{ isPrivate: false }}
        >
          <Form.Item
            label="Repository Name"
            name="name"
            rules={[{ required: true, message: "Repository name is required." }]}
          >
            <Input placeholder="my-awesome-project" data-ai-field="github-repo-name" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>
          <Form.Item name="isPrivate" valuePropName="checked">
            <Checkbox>Private repository</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MyProjectsPage;

