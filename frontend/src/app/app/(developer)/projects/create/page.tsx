"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Checkbox, Collapse, Form, Input, InputNumber, Select, Typography } from "antd";
import { ArrowLeft, Wand2 } from "lucide-react";
import { toast } from "@/components/providers";
import { useBuildActions } from "@/providers/build-provider";
import { PURPOSES } from "@/lib/buildJourney";
import { isRepoSafetyUnsafe } from "@/utils/repoSafety";
import { normalizeSkills } from "./aiPromptHelpers";
import { DIFFICULTY_OPTIONS } from "./projectOptions";
import { useProjectAi } from "./useProjectAi";
import { useProjectRepository } from "./useProjectRepository";
import { ProjectRepositoryFields } from "./ProjectRepositoryFields";
import { useStyles } from "./style";
import { useProjectDraft } from "./useProjectDraft";

const CreateProjectPage = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [repositoryEnabled, setRepositoryEnabled] = useState(false);
  const [form] = Form.useForm();
  const submitInFlight = useRef(false);
  const router = useRouter();
  const { styles } = useStyles();
  const { createBuild } = useBuildActions();
  const draft = useProjectDraft(form);
  const ai = useProjectAi(form);
  const repository = useProjectRepository(form, repositoryEnabled);
  const { selectedGithubRepo, resolveSelectedRepoUrl, repoSafetyResult, isRepoSafetyChecking } = repository;
  const zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["Africa/Johannesburg", "Europe/London", "America/New_York", "Asia/Kolkata"];
  const handleCreateProject = async () => {
    if (submitInFlight.current) return;
    submitInFlight.current = true;
    try {
      const values = await form.validateFields();
      const repoValue = String(values.githubRepo ?? "").trim();
      const selectedRepoUrl = repoValue ? resolveSelectedRepoUrl(repoValue) : "";
      const isUnsafeSelection = isRepoSafetyUnsafe(repoSafetyResult);

      if (repoValue && !selectedRepoUrl) {
        throw new Error("Choose a repository from your GitHub list, or clear the repository field.");
      }

      if (selectedRepoUrl && isRepoSafetyChecking) {
        throw new Error("Repository safety scan is still running. Please wait.");
      }

      if (selectedRepoUrl && !repoSafetyResult) {
        throw new Error("Repository safety check is required before project creation.");
      }

      if (selectedRepoUrl && isUnsafeSelection) {
        throw new Error(
          "This repository cannot be added because the safety scan detected potentially malicious code.",
        );
      }

      setIsCreating(true);
      const created = await createBuild({
        title: values.title,
        description: values.description,
        problemStatement: values.problemStatement,
        purpose: Number(values.purpose),
        firstOutcome: values.firstOutcome,
        createStarterTask: Boolean(values.createStarterTask),
        teamTimeZone: values.teamTimeZone,
        isPublic: Boolean(values.isPublic),
        githubRepo: selectedRepoUrl ? values.githubRepo : "",
        difficulty: Number(values.difficulty),
        estimatedHoursPerWeek: Number(values.estimatedHoursPerWeek),
        skills: normalizeSkills(String(values.skills ?? "")),
      });

      toast.success("Project created", "Your project has been created.");
      draft.clear();
      if (created?.id) {
        router.push(`/app/build/${created.id}`);
      } else {
        router.push("/app/work");
      }
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        const fields = error.errorFields as Array<{ name: string[] }>;
        if (fields[0]) form.scrollToField(fields[0].name, { focus: true });
        return;
      }
      const message = error instanceof Error ? error.message : "Failed to create project.";
      toast.error("Create failed", message);
    } finally {
      submitInFlight.current = false;
      setIsCreating(false);
    }
  };


  return <div className={styles.page} data-ai-page="projects-create">
    <header className={styles.header}>
      <Link href="/app"><Button icon={<ArrowLeft size={14} />}>Back to home</Button></Link>
      <Typography.Title level={1} className={styles.headerTitle}>Create project</Typography.Title>
      <Typography.Paragraph className={styles.headerMeta}>
        Describe the project, set a first milestone, and choose how people can join.
      </Typography.Paragraph>
    </header>
    {(draft.restored || draft.saved) && <Typography.Paragraph type="secondary">{draft.restored ? "Your unfinished project was restored." : "Draft saved in this browser tab."}</Typography.Paragraph>}
    <Form form={form} layout="vertical" className={styles.formGrid} onValuesChange={draft.save}
      initialValues={{ isPublic: false, createStarterTask: true, purpose: 0, difficulty: 1, estimatedHoursPerWeek: 4, teamTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }}>
      <section className={styles.card} aria-label="Project details">
        <Form.Item label="Project Title" name="title" rules={[{ required: true, whitespace: true, message: "Give your project a title." }]}>
          <Input placeholder="For example, Community skill-sharing app" maxLength={160} />
        </Form.Item>
        <Form.Item label="Problem statement" name="problemStatement"
          rules={[{ required: true, whitespace: true, message: "Explain the problem your team will solve." }]}>
          <Input.TextArea placeholder="Who has this problem, and why is it hard to solve?"
            autoSize={{ minRows: 3, maxRows: 7 }} maxLength={4000} showCount />
        </Form.Item>
        <Form.Item label="Description" name="description"
          rules={[{ required: true, whitespace: true, message: "Describe what your team will build." }]}>
          <Input.TextArea placeholder="Describe the solution and what your team will build." autoSize={{minRows:3,maxRows:10}} maxLength={8000}/>
        </Form.Item>
        <Form.Item label="First milestone" name="firstOutcome" extra="The first outcome your team plans to finish and review." rules={[{required:true,whitespace:true,message:"Choose one small outcome to work towards."}]}>
          <Input.TextArea placeholder="For example, a working signup flow that three classmates can try." autoSize={{minRows:2,maxRows:5}} maxLength={800}/>
        </Form.Item>
        <Form.Item name="createStarterTask" valuePropName="checked" extra="Uses the milestone above as the task title and acceptance criteria. You can add more tasks in the workspace.">
          <Checkbox>Create a first task from this milestone</Checkbox>
        </Form.Item>
        <Form.Item name="isPublic" valuePropName="checked" extra="Public projects appear in Find a project. Private projects are visible to your team and invited developers.">
          <Checkbox>Allow developers to find and join this project</Checkbox>
        </Form.Item>
        <Form.Item label="Project goal" name="purpose" rules={[{ required: true }]}>
          <Select virtual={false} options={PURPOSES.map((label,value)=>({label,value}))}/>
        </Form.Item>
        <Form.Item label="Skills to use or learn" name="skills" extra="You can include skills you want to practice, even if you are still learning them.">
          <Input placeholder="For example, React, TypeScript, teamwork" />
        </Form.Item>
        <div className={styles.twoCol}>
          <Form.Item label="Experience level" name="difficulty" rules={[{ required: true }]}>
            <Select virtual={false} options={DIFFICULTY_OPTIONS} />
          </Form.Item>
          <Form.Item label="Hours per week" name="estimatedHoursPerWeek" extra="Expected time per person, including meetings and reviews." rules={[{ required: true }]}>
            <InputNumber min={1} max={40} className={styles.fullWidth} />
          </Form.Item>
        </div>
        <Form.Item label="Team time zone (optional)" name="teamTimeZone" extra="A starting point for arranging check-ins. Confirm your actual availability together.">
          <Select showSearch allowClear optionFilterProp="label" placeholder="Choose a time zone" options={["UTC", ...zones].map(value=>({value,label:value.replaceAll("_"," ")}))}/>
        </Form.Item>
      </section>
      <Collapse className={styles.optionalSections} onChange={(keys) => setRepositoryEnabled(keys.includes("github"))} items={[
        { key: "ai", label: "Draft with AI (optional)", children: <section className={styles.sectionField}>
          <Typography.Paragraph>Describe your idea or ask for help improving the brief. Review the draft before creating your project.</Typography.Paragraph>
          <Input.TextArea rows={3} value={ai.aiPrompt} onChange={(event) => ai.setAiPrompt(event.target.value)}
            aria-label="Context for AI draft" placeholder="For example, Help us plan a beginner-friendly app to share study notes." />
          <div className={styles.actionRow}>
            <Button icon={<Wand2 size={14} />} loading={ai.isGeneratingSpec} onClick={() => void ai.handleGenerateProject()} data-ai-action="generate-project-spec">Generate Project</Button>
            <Button disabled={ai.isGeneratingSpec} onClick={() => void ai.handleUseAiForMarkdown()}>Improve overview</Button>
            <Button disabled={ai.isGeneratingSpec} onClick={() => void ai.handleUseAiForSkills()}>Suggest skills</Button>
          </div>
        </section> },
        { key: "github", label: "Link a GitHub repository (optional)", forceRender: true,
          children: <ProjectRepositoryFields repository={repository} /> },
      ]} />
      <div className={styles.footerRow}>
        <Button onClick={() => router.push("/app")}>Cancel</Button>
        <Button type="primary" loading={isCreating} onClick={() => void handleCreateProject()}
          disabled={Boolean(selectedGithubRepo) && (isRepoSafetyChecking || isRepoSafetyUnsafe(repoSafetyResult) || !repoSafetyResult)}>
          Create project
        </Button>
      </div>
    </Form>
  </div>;
};
export default CreateProjectPage;
