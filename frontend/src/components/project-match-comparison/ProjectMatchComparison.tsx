"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Empty, Modal, Space, Spin, Tag, Typography } from "antd";
import { Sparkles } from "lucide-react";
import { toast } from "@/components/providers";
import { useProjectAction } from "@/providers/project-provider";
import type { IProject, IProjectJoinLoadWarning } from "@/providers/project-provider/context";
import { useStyles } from "./styles";

interface IJoinWarningState {
  projectId: string;
  warning: IProjectJoinLoadWarning;
}

export const ProjectMatchComparison = () => {
  const [matches, setMatches] = useState<IProject[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [joiningProjectId, setJoiningProjectId] = useState<string>();
  const [joinWarning, setJoinWarning] = useState<IJoinWarningState | null>(null);
  const { styles } = useStyles();
  const {
    fetchOpenProjects,
    aiMatchProject,
    getJoinProjectLoadWarning,
    joinProject,
  } = useProjectAction();

  const findMatches = async () => {
    setIsMatching(true);
    try {
      const availableProjects = await fetchOpenProjects();
      const bestMatch = await aiMatchProject();
      if (!bestMatch) {
        setMatches([]);
        toast.info("No matches", "No matching open projects found.");
        return;
      }

      const otherMatches = availableProjects
        .filter((project) => project.id !== bestMatch.id)
        .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
      setMatches([bestMatch, ...otherMatches].slice(0, 3));
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI matching failed.";
      toast.error("Match failed", message);
    } finally {
      setIsMatching(false);
    }
  };

  const join = async (projectId: string, confirmHighWorkload = false) => {
    setJoiningProjectId(projectId);
    try {
      await joinProject(projectId, confirmHighWorkload);
      toast.success("Joined project", "You successfully joined this project.");
      setMatches((current) => current.filter((project) => project.id !== projectId));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to join project.";
      toast.error("Join failed", message);
    } finally {
      setJoiningProjectId(undefined);
    }
  };

  const requestJoin = async (projectId: string) => {
    setJoiningProjectId(projectId);
    try {
      const warning = await getJoinProjectLoadWarning(projectId);
      if (warning?.shouldWarn) {
        setJoinWarning({ projectId, warning });
        return;
      }
      await join(projectId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not evaluate project workload.";
      toast.error("Join blocked", message);
    } finally {
      setJoiningProjectId(undefined);
    }
  };

  return (
    <section className={styles.section} id="ai-match-comparison" aria-label="AI project matches">
      <div className={styles.header}>
        <div>
          <Typography.Title level={3} className={styles.title}>Find your next project</Typography.Title>
          <Typography.Paragraph className={styles.subtitle}>
            Compare your best matches using your skills and goals.
          </Typography.Paragraph>
        </div>
        <Button
          type="primary"
          icon={<Sparkles size={16} />}
          loading={isMatching}
          onClick={() => void findMatches()}
          data-ai-action="ai-match-project"
        >
          AI Match Me
        </Button>
      </div>

      {isMatching ? (
        <div className={styles.loading}><Spin tip="Comparing open projects..." /></div>
      ) : matches.length > 0 ? (
        <div className={styles.matchGrid} data-testid="ai-match-grid">
          {matches.map((project, index) => {
            const isFull = project.maxMembers != null && project.members.length >= project.maxMembers;
            return (
              <article key={project.id} className={styles.matchCard} data-testid="project-match">
                <div className={styles.cardHeading}>
                  <Typography.Title level={4} className={styles.projectTitle}>{project.title}</Typography.Title>
                  {index === 0 ? <Tag color="gold">AI pick</Tag> : <Tag color="blue">{project.matchScore ?? 0}% fit</Tag>}
                </div>
                <Typography.Paragraph className={styles.insight}>
                  {project.matchInsight || `${project.matchScore ?? 0}% fit based on your skills and goals.`}
                </Typography.Paragraph>
                <div className={styles.problem}>
                  <Typography.Text strong>Problem to solve</Typography.Text>
                  <Typography.Paragraph className={styles.problemText}>
                    {project.problemStatement?.trim() || "This older project does not have a problem statement yet."}
                  </Typography.Paragraph>
                </div>
                <Typography.Text type="secondary">Skills</Typography.Text>
                <div className={styles.tags}>
                  {project.skills.slice(0, 5).map((skill) => <Tag key={skill}>{skill}</Tag>)}
                  {project.skills.length === 0 ? <Tag>Open to learners</Tag> : null}
                </div>
                {index === 0 && (project.learningOutcomes?.length ?? 0) > 0 ? (
                  <div>
                    <Typography.Text type="secondary">What you can learn</Typography.Text>
                    <ul className={styles.outcomes}>
                      {project.learningOutcomes?.slice(0, 3).map((outcome) => <li key={outcome}>{outcome}</li>)}
                    </ul>
                  </div>
                ) : null}
                <Typography.Text type="secondary">
                  {project.maxMembers == null ? `${project.members.length} members` : `${project.members.length}/${project.maxMembers} members`} · {project.estimatedHoursPerWeek} hrs/week · {project.difficulty}
                </Typography.Text>
                <Space className={styles.actions} wrap>
                  <Link href={`/app/projects/${project.id}`}><Button>Compare details</Button></Link>
                  <Button
                    type="primary"
                    disabled={isFull}
                    loading={joiningProjectId === project.id}
                    onClick={() => void requestJoin(project.id)}
                  >
                    {isFull ? "Team full" : "Join project"}
                  </Button>
                </Space>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty description="Run AI Match Me to compare up to three projects selected for you." />
      )}

      <Modal
        open={Boolean(joinWarning)}
        title="Workload Warning"
        onCancel={() => setJoinWarning(null)}
        footer={[
          <Button key="cancel" onClick={() => setJoinWarning(null)}>Cancel</Button>,
          <Button
            key="continue"
            type="primary"
            loading={Boolean(joiningProjectId)}
            onClick={() => {
              const projectId = joinWarning?.projectId;
              setJoinWarning(null);
              if (projectId) void join(projectId, true);
            }}
          >Continue Anyway</Button>,
        ]}
      >
        <Typography.Paragraph>{joinWarning?.warning.message}</Typography.Paragraph>
        <Typography.Text type="secondary">
          Active projects: {joinWarning?.warning.activeProjects ?? 0} / {joinWarning?.warning.recommendedProjectLimit ?? 0}
        </Typography.Text>
      </Modal>
    </section>
  );
};
