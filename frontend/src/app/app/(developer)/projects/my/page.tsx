"use client";

import Link from "next/link";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button, Card, Empty, Typography } from "antd";
import { FolderKanban, Plus } from "lucide-react";
import { ProjectCard } from "@/components/project-card/ProjectCard";
import { ProjectMatchComparison } from "@/components/project-match-comparison/ProjectMatchComparison";
import { useDeveloperAction } from "@/providers/developer-provider";
import { useProjectAction, useProjectState } from "@/providers/project-provider";
import { useStyles } from "./style";

const MyProjectsPage = () => {
  const { styles } = useStyles();

  const { fetchCurrentUser } = useDeveloperAction();
  const { myProjects } = useProjectState();
  const { fetchMyProjects, fetchOpenProjects } = useProjectAction();

  useEffect(() => {
    fetchCurrentUser();
    fetchMyProjects();
    fetchOpenProjects();
  }, []);

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

      <ProjectMatchComparison />

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

    </div>
  );
};

export default MyProjectsPage;
