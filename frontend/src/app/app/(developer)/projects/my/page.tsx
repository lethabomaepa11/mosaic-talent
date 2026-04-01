"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Card, Empty, Spin, Typography } from "antd";
import { FolderKanban, Plus, Sparkles } from "lucide-react";
import { toast } from "@/components/providers";
import { ProjectCard } from "@/components/project-card/ProjectCard";
import { useDeveloperAction } from "@/providers/developer-provider";
import { useProjectAction, useProjectState } from "@/providers/project-provider";
import { useStyles } from "./style";

const MyProjectsPage = () => {
  const [isMatching, setIsMatching] = useState(false);
  const router = useRouter();
  const { styles } = useStyles();

  const { fetchCurrentUser } = useDeveloperAction();
  const { myProjects } = useProjectState();
  const { fetchMyProjects, fetchOpenProjects, aiMatchProject } = useProjectAction();

  useEffect(() => {
    fetchCurrentUser();
    fetchMyProjects();
    fetchOpenProjects();
  }, []);

  const handleAIMatch = async () => {
    setIsMatching(true);
    try {
      const matched = await aiMatchProject();
      if (!matched) {
        toast.info("No matches", "No matching open projects found.");
        return;
      }

      toast.success("Match found", `Best match: "${matched.title}".`);
      router.push(`/app/projects/${matched.id}?from=ai-match`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI matching failed.";
      toast.error("Match failed", message);
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className={styles.page} data-ai-page="projects-my">
      <motion.div className={styles.header} initial={false} animate={{ opacity: 1, y: 0 }}>
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
          <Button
            onClick={handleAIMatch}
            loading={isMatching}
            icon={<Sparkles size={14} />}
            data-ai-action="ai-match-project"
          >
            AI Match Me
          </Button>
          <Link href="/app/projects/create">
            <Button
              type="primary"
              icon={<Plus size={14} />}
              data-ai-action="open-create-project-page"
            >
              New Project
            </Button>
          </Link>
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
    </div>
  );
};

export default MyProjectsPage;
