"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  AutoComplete,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Typography,
} from "antd";
import MDEditor from "@uiw/react-md-editor";
import { ArrowLeft, BookOpenText, Sparkles, Wand2 } from "lucide-react";
import { toast } from "@/components/providers";
import { useProjectAction } from "@/providers/project-provider";
import { useAppearanceState } from "@/providers/appearance-provider";
import { IRepoSafetyResult } from "@/providers/project-provider/context";
import { isRepoSafetyUnsafe } from "@/utils/repoSafety";
import {
  buildFullDraftPrompt,
  buildMarkdownFromTitlePrompt,
  buildMarkdownPolishPrompt,
  buildSkillsFromContextPrompt,
  buildSkillsPolishPrompt,
  normalizeSkills,
  skillsToFieldValue,
} from "./aiPromptHelpers";
import { useStyles } from "./style";

const DIFFICULTY_OPTIONS = [
  { label: "Beginner", value: 0 },
  { label: "Intermediate", value: 1 },
  { label: "Advanced", value: 2 },
  { label: "Expert", value: 3 },
];

const CreateProjectPage = () => {
  const [form] = Form.useForm();
  const [repoForm] = Form.useForm();
  const router = useRouter();
  const { styles } = useStyles();

  const [isCreating, setIsCreating] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isGithubStatusLoading, setIsGithubStatusLoading] = useState(false);
  const [isRepoCreateOpen, setIsRepoCreateOpen] = useState(false);
  const [isRepoCreating, setIsRepoCreating] = useState(false);
  const [isRepoSafetyChecking, setIsRepoSafetyChecking] = useState(false);
  const [repoSafetyError, setRepoSafetyError] = useState("");
  const [repoSafetyResult, setRepoSafetyResult] = useState<IRepoSafetyResult | undefined>(
    undefined,
  );
  const [isGeneratingSpec, setIsGeneratingSpec] = useState(false);
  const [isLoadingReadme, setIsLoadingReadme] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

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

  const {
    getGithubConnectionStatus,
    getMyGithubRepositories,
    createGithubRepository,
    getRepositoryReadme,
    aiGenerateProjectSpec,
    createProject,
    scanRepoSafetyByGithubUrl,
  } = useProjectAction();
  const { mode } = useAppearanceState();

  const selectedGithubRepo = Form.useWatch("githubRepo", form);
  const descriptionValue = Form.useWatch("description", form);
  const titleValue = Form.useWatch("title", form);
  const skillsValue = Form.useWatch("skills", form);
  const githubConnectUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TokenAuth/GitHubAuth?mode=connect&returnPath=${encodeURIComponent("/projects/create")}`
    : "";

  const repoOptions = useMemo(
    () =>
      githubRepos.map((repo) => {
        const repoKey = repo.fullName || repo.name;
        return {
          value: repoKey,
          label: `${repoKey}${repo.isPrivate ? " (private)" : ""}`,
        };
      }),
    [githubRepos],
  );

  const resolveSelectedRepoUrl = useCallback(
    (value: string) => {
      const selected = githubRepos.find((repo) => {
        const repoKey = repo.fullName || repo.name;
        return repoKey === value;
      });

      if (selected?.fullName) {
        return `https://github.com/${selected.fullName}`;
      }

      return value.startsWith("https://github.com/") ? value : "";
    },
    [githubRepos],
  );

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
        setRepoSafetyResult(undefined);
        setRepoSafetyError("");
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
        error instanceof Error ? error.message : "Failed to load GitHub context.";
      toast.error("GitHub unavailable", message);
    } finally {
      setIsGithubLoading(false);
    }
  };

  useEffect(() => {
    void loadGithubContext();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isGithubConnected = params.get("githubConnected");
    const githubConnectError = params.get("githubConnectError");
    if (isGithubConnected === "1") {
      toast.success("GitHub connected", "Your GitHub account is now connected.");
      void loadGithubContext();
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
    if (!githubConnection.isConnected || !selectedGithubRepo) {
      setRepoSafetyResult(undefined);
      setRepoSafetyError("");
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
          error instanceof Error ? error.message : "Repository safety scan failed.",
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
  }, [selectedGithubRepo, githubConnection.isConnected]);

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

  const handleUseReadme = async () => {
    const repoKey = String(form.getFieldValue("githubRepo") ?? "");
    if (!repoKey) {
      toast.error("Select repository", "Choose a repository first.");
      return;
    }

    setIsLoadingReadme(true);
    try {
      const readme = await getRepositoryReadme(repoKey);
      if (!readme?.content) {
        throw new Error("README was empty.");
      }

      form.setFieldValue("description", readme.content);
      toast.success("README copied", "Project description has been filled from README.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load README content.";
      toast.error("README load failed", message);
    } finally {
      setIsLoadingReadme(false);
    }
  };

  const runAiSpec = async (prompt: string) => {
    setIsGeneratingSpec(true);
    try {
      const suggestion = await aiGenerateProjectSpec(
        prompt,
        String(form.getFieldValue("githubRepo") ?? ""),
      );

      if (!suggestion) {
        throw new Error("No suggestion received.");
      }
      return suggestion;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate project spec.";
      toast.error("AI generation failed", message);
      return undefined;
    } finally {
      setIsGeneratingSpec(false);
    }
  };

  const handleGenerateProject = async () => {
    const prompt = buildFullDraftPrompt(
      aiPrompt,
      String(titleValue ?? ""),
      String(descriptionValue ?? ""),
      String(skillsValue ?? ""),
    );
    const suggestion = await runAiSpec(prompt);
    if (!suggestion) {
      return;
    }

    const difficultyValue = DIFFICULTY_OPTIONS.find(
      (item) => item.label.toLowerCase() === suggestion.difficulty,
    )?.value;

    form.setFieldsValue({
      title: suggestion.title,
      description: suggestion.descriptionMarkdown,
      skills: skillsToFieldValue(suggestion.skills),
      difficulty: difficultyValue ?? 1,
      estimatedHoursPerWeek: suggestion.estimatedHoursPerWeek,
    });
    toast.success("Draft updated", "AI updated title, markdown, and skills.");
  };

  const handleUseAiForMarkdown = async () => {
    const title = String(titleValue ?? "").trim();
    const description = String(descriptionValue ?? "").trim();
    if (!title && !description) {
      toast.error("Missing context", "Add a title or markdown first.");
      return;
    }

    const prompt = description
      ? buildMarkdownPolishPrompt(aiPrompt, title, description)
      : buildMarkdownFromTitlePrompt(aiPrompt, title);
    const suggestion = await runAiSpec(prompt);
    if (!suggestion?.descriptionMarkdown) {
      return;
    }

    form.setFieldValue("description", suggestion.descriptionMarkdown);
    toast.success("Markdown updated", "Description was updated using AI.");
  };

  const handleUseAiForSkills = async () => {
    const title = String(titleValue ?? "").trim();
    const description = String(descriptionValue ?? "").trim();
    const rawSkills = String(skillsValue ?? "").trim();
    if (!title && !description && !rawSkills) {
      toast.error("Missing context", "Add a title, markdown, or skills first.");
      return;
    }

    const prompt = rawSkills
      ? buildSkillsPolishPrompt(aiPrompt, title, description, rawSkills)
      : buildSkillsFromContextPrompt(aiPrompt, title, description);
    const suggestion = await runAiSpec(prompt);
    const updatedSkills = suggestion?.skills?.length
      ? suggestion.skills
      : normalizeSkills(rawSkills);
    if (updatedSkills.length === 0) {
      return;
    }

    form.setFieldValue("skills", skillsToFieldValue(updatedSkills));
    toast.success("Skills updated", "Skills were updated using AI.");
  };

  const handleCreateProject = async () => {
    try {
      const values = await form.validateFields();
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

      setIsCreating(true);
      const created = await createProject({
        title: values.title,
        description: values.description,
        maxMembers: values.maxMembers,
        githubRepo: values.githubRepo,
        difficulty: Number(values.difficulty),
        estimatedHoursPerWeek: Number(values.estimatedHoursPerWeek),
        skills: normalizeSkills(String(values.skills ?? "")),
        type: Number(values.type),
        status: Number(values.status),
      });

      toast.success("Project created", "Your project has been created.");
      if (created?.id) {
        router.push(`/app/projects/${created.id}`);
      } else {
        router.push("/app/projects/my");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create project.";
      toast.error("Create failed", message);
    } finally {
      setIsCreating(false);
    }
  };

  const isUnsafeRepo = isRepoSafetyUnsafe(repoSafetyResult);

  return (
    <div className={styles.page} data-ai-page="projects-create">
      <div className={styles.header}>
        <Link href="/app/projects/my">
          <Button icon={<ArrowLeft size={14} />}>Back to My Projects</Button>
        </Link>
        <Typography.Title level={2} className={styles.headerTitle}>
          Create Project
        </Typography.Title>
        <Typography.Paragraph className={styles.headerMeta}>
          Pick a repository, pass safety checks, and define your project scope with
          markdown specs. You can generate an AI draft and refine it before launch.
        </Typography.Paragraph>
      </div>

      <Card className={styles.aiCard}>
        <Typography.Title level={4} className={styles.aiTitle}>
          Create With AI
        </Typography.Title>
        <Typography.Paragraph className={styles.aiDescription}>
          Add context for AI-assisted drafting. Use this when you want help generating
          the initial project title, markdown spec, and skills.
        </Typography.Paragraph>
        <Input.TextArea
          rows={3}
          value={aiPrompt}
          onChange={(event) => setAiPrompt(event.target.value)}
          placeholder="Example: Build a practical team project for API security testing with CI checks."
        />
        <div className={styles.actionRow}>
          <Button
            icon={<Wand2 size={14} />}
            loading={isGeneratingSpec}
            onClick={() => void handleGenerateProject()}
            data-ai-action="generate-project-spec"
          >
            Generate Project
          </Button>
        </div>
      </Card>

      <Card className={styles.card}>
        <Form
          form={form}
          layout="vertical"
          className={styles.formGrid}
          initialValues={{
            maxMembers: 4,
            type: 1,
            status: 1,
            difficulty: 1,
            estimatedHoursPerWeek: 6,
          }}
        >
          <Form.Item label="Project Title" name="title" rules={[{ required: true }]}>
            <Input placeholder="AI Interview Preparation Workspace" />
          </Form.Item>

          <div className={styles.twoCol}>
            <Form.Item
              label="Project Difficulty"
              name="difficulty"
              rules={[{ required: true }]}
            >
              <Select options={DIFFICULTY_OPTIONS} />
            </Form.Item>
            <Form.Item
              label="Estimated Hours / Week"
              name="estimatedHoursPerWeek"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={40} className={styles.fullWidth} />
            </Form.Item>
          </div>

          <Form.Item
            label="Description (Markdown)"
            name="description"
            rules={[{ required: true }]}
          >
            <div className={styles.sectionField}>
              <div className={styles.actionRow}>
                <Button
                  loading={isGeneratingSpec}
                  onClick={() => void handleUseAiForMarkdown()}
                >
                  Use AI
                </Button>
              </div>
              <MDEditor
                value={String(descriptionValue ?? "")}
                onChange={(value) => {
                  form.setFieldValue("description", value ?? "");
                }}
                preview="live"
                height={420}
                textareaProps={{
                  placeholder: "Write markdown specs for your team.",
                }}
                data-color-mode={mode}
                className={styles.markdownEditor}
              />
            </div>
          </Form.Item>

          <Form.Item label="You're a match if you have these skills or willing to learn">
            <div className={styles.sectionField}>
              <div className={styles.actionRow}>
                <Button
                  loading={isGeneratingSpec}
                  onClick={() => void handleUseAiForSkills()}
                >
                  Use AI
                </Button>
              </div>
              <Form.Item name="skills" noStyle>
                <Input placeholder="React, TypeScript, Node.js" />
              </Form.Item>
            </div>
          </Form.Item>

          <div className={styles.twoCol}>
            <Form.Item label="Max Team Members" name="maxMembers" rules={[{ required: true }]}>
              <InputNumber min={2} max={8} className={styles.fullWidth} />
            </Form.Item>
            <Form.Item label="Project Type" name="type">
              <Select
                options={[
                  { label: "Personal", value: 0 },
                  { label: "Group", value: 1 },
                ]}
              />
            </Form.Item>
          </div>

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
                    Project creation requires selecting one of your GitHub repositories.
                  </Typography.Text>
                  <Button onClick={handleConnectGithub}>Connect GitHub</Button>
                </Space>
              }
              showIcon
            />
          ) : (
            <div className={styles.statusRow}>
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
                />
              </Form.Item>

              <div className={styles.actionRow}>
                <Button onClick={() => void loadGithubContext()}>Refresh Repositories</Button>
                <Button onClick={handleConnectGithub}>Reconnect GitHub Access</Button>
                <Button onClick={() => setIsRepoCreateOpen(true)}>Create Repository</Button>
                <Button
                  icon={<BookOpenText size={14} />}
                  loading={isLoadingReadme}
                  onClick={() => void handleUseReadme()}
                >
                  Use README as Description
                </Button>
              </div>
              <Typography.Text type="secondary">
                If repository creation fails due permissions, reconnect GitHub and approve repository access.
              </Typography.Text>

              {isRepoSafetyChecking ? (
                <Alert type="info" showIcon message="Running repository safety scan..." />
              ) : null}
              {!isRepoSafetyChecking && repoSafetyError ? (
                <Alert type="error" showIcon message={repoSafetyError} />
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
            </div>
          )}

          <div className={styles.footerRow}>
            <Button onClick={() => router.push("/app/projects/my")}>Cancel</Button>
            <Button
              type="primary"
              loading={isCreating}
              icon={<Sparkles size={14} />}
              onClick={() => void handleCreateProject()}
              disabled={
                isGithubStatusLoading ||
                !githubConnection.isConnected ||
                isGithubLoading ||
                isRepoSafetyChecking ||
                isUnsafeRepo ||
                (Boolean(selectedGithubRepo) && !repoSafetyResult)
              }
            >
              Create Project
            </Button>
          </div>
        </Form>
      </Card>

      <Modal
        title="Create GitHub Repository"
        open={isRepoCreateOpen}
        onCancel={() => setIsRepoCreateOpen(false)}
        onOk={handleCreateRepository}
        confirmLoading={isRepoCreating}
        okText="Create Repository"
      >
        <Form form={repoForm} layout="vertical" initialValues={{ isPrivate: false }}>
          <Form.Item
            label="Repository Name"
            name="name"
            rules={[{ required: true, message: "Repository name is required." }]}
          >
            <Input placeholder="my-awesome-project" />
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

export default CreateProjectPage;
