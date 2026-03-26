"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Spin,
  Typography,
} from "antd";
import { FolderKanban, Plus, Sparkles } from "lucide-react";
import { toast } from "@/components/providers";
import { ProjectCard } from "@/components/project-card/ProjectCard";
import { useDeveloperAction } from "@/providers/developer-provider";
import { useProjectAction, useProjectState } from "@/providers/project-provider";
import { useStyles } from "./style";

const MyProjectsPage = () => {
  const [form] = Form.useForm();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const { styles } = useStyles();
  const { fetchCurrentUser } = useDeveloperAction();
  const { myProjects } = useProjectState();
  const {
    fetchMyProjects,
    fetchOpenProjects,
    createProject,
    aiMatchProject,
  } = useProjectAction();

  useEffect(() => {
    fetchCurrentUser();
    fetchMyProjects();
    fetchOpenProjects();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("create") === "true") {
      setIsCreateOpen(true);
    }

    if (params.get("match") === "true") {
      void handleAIMatch();
    }
  }, []);

  const handleAIMatch = async () => {
    setIsMatching(true);
    try {
      const matched = await aiMatchProject();
      if (matched) {
        toast.success("Match found", `AI matched you to "${matched.title}".`);
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

  const handleCreateProject = async () => {
    try {
      const values = await form.validateFields();
      setIsCreating(true);

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

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 20 }}
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
          <Button onClick={handleAIMatch} loading={isMatching} icon={<Sparkles size={14} />}>
            AI Match Me
          </Button>
          <Button type="primary" icon={<Plus size={14} />} onClick={() => setIsCreateOpen(true)}>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.matchingContent}
              initial={{ scale: 0.95, opacity: 0 }}
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
      >
        <Form
          form={form}
          layout="vertical"
          className={styles.formGrid}
          initialValues={{ maxMembers: 4, type: 1, status: 1 }}
        >
          <Form.Item label="Project Title" name="title" rules={[{ required: true }]}> 
            <Input placeholder="E-commerce Dashboard" />
          </Form.Item>
          <Form.Item label="Description" name="description" rules={[{ required: true }]}> 
            <Input.TextArea rows={4} placeholder="Describe your project..." />
          </Form.Item>
          <Form.Item label="Max Team Members" name="maxMembers" rules={[{ required: true }]}> 
            <InputNumber min={2} max={8} className={styles.fullWidth} />
          </Form.Item>
          <Form.Item label="GitHub Repo URL" name="githubRepo">
            <Input placeholder="https://github.com/owner/repo" />
          </Form.Item>
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
    </div>
  );
};

export default MyProjectsPage;
