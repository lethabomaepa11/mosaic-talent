"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Empty, Typography } from "antd";
import { Sparkles, X } from "lucide-react";
import { toast } from "@/components/providers";
import { ProjectCard } from "@/components/project-card/ProjectCard";
import { useDeveloperAction } from "@/providers/developer-provider";
import { useProjectAction, useProjectState } from "@/providers/project-provider";
import { IRepoSafetyScan } from "@/providers/project-provider/context";
import { useStyles } from "./style";

const OpenProjectsPage = () => {
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [repoSafetyByProject, setRepoSafetyByProject] = useState<
    Record<string, IRepoSafetyScan | undefined>
  >({});
  const [repoSafetyPending, setRepoSafetyPending] = useState<Record<string, boolean>>({});
  const [repoSafetyError, setRepoSafetyError] = useState<Record<string, string>>({});
  const { styles } = useStyles();

  const { fetchCurrentUser } = useDeveloperAction();
  const { openProjects } = useProjectState();
  const { fetchOpenProjects, joinProject, scanRepoSafety } = useProjectAction();

  useEffect(() => {
    fetchCurrentUser();
    fetchOpenProjects();
  }, []);

  useEffect(() => {
    setSwipeIndex(0);
  }, [openProjects.length]);

  const swipeProjects = useMemo(() => {
    return openProjects.slice(swipeIndex, swipeIndex + 3);
  }, [openProjects, swipeIndex]);
  const cx = (...values: Array<string | false | undefined>) => values.filter(Boolean).join(" ");

  const handleSwipeJoin = async (projectId: string) => {
    try {
      await joinProject(projectId);
      toast.success("Joined project", "You successfully joined this project.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to join project.";
      toast.error("Join failed", message);
    } finally {
      setSwipeIndex((prev) => prev + 1);
    }
  };

  const handleSwipeSkip = () => {
    setSwipeIndex((prev) => prev + 1);
  };

  const handleScanRepoSafety = async (projectId: string) => {
    setRepoSafetyPending((prev) => ({ ...prev, [projectId]: true }));
    setRepoSafetyError((prev) => ({ ...prev, [projectId]: "" }));

    try {
      const result = await scanRepoSafety(projectId);
      setRepoSafetyByProject((prev) => ({ ...prev, [projectId]: result }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to scan repository.";
      setRepoSafetyError((prev) => ({ ...prev, [projectId]: message }));
    } finally {
      setRepoSafetyPending((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  return (
    <div className={styles.page} data-ai-page="projects-open">
      <motion.div
        className={styles.header}
        initial={false}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <Typography.Title level={2} className={styles.title}>
            Open Projects
          </Typography.Title>
          <Typography.Paragraph className={styles.subtitle}>
            Swipe right to join, swipe left to skip.
          </Typography.Paragraph>
        </div>
        <div className={styles.actionRow}>
          <Link href="/app/projects/my">
            <Button>Go to My Projects</Button>
          </Link>
        </div>
      </motion.div>

      <div className={styles.swipeBoard}>
        {swipeProjects.length === 0 ? (
          <Empty description="No more open projects to swipe." />
        ) : (
          <>
            <div className={styles.swipeStack}>
              <AnimatePresence>
                {swipeProjects
                  .slice()
                  .reverse()
                  .map((project, index) => {
                    const isTop = index === swipeProjects.length - 1;
                    const visualOffset = (swipeProjects.length - 1 - index) * 10;

                    return (
                      <motion.div
                        key={project.id}
                        className={cx(styles.swipeCard, isTop && styles.swipeCardTop)}
                        initial={false}
                        animate={{
                          opacity: 1,
                          y: visualOffset,
                          scale: 1 - visualOffset * 0.01,
                        }}
                        exit={{ opacity: 0, x: 260, rotate: 12 }}
                        drag={isTop ? "x" : false}
                        dragElastic={0.18}
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={(_, info) => {
                          if (info.offset.x > 120) {
                            void handleSwipeJoin(project.id);
                            return;
                          }

                          if (info.offset.x < -120) {
                            handleSwipeSkip();
                          }
                        }}
                      >
                        <ProjectCard
                          project={project}
                          onJoin={() => void handleSwipeJoin(project.id)}
                          repoSafety={repoSafetyByProject[project.id]?.result}
                          repoSafetyProgress={repoSafetyByProject[project.id]?.progress}
                          isRepoSafetyPending={repoSafetyPending[project.id]}
                          repoSafetyError={repoSafetyError[project.id]}
                          onScanRepo={() => void handleScanRepoSafety(project.id)}
                        />
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>
            <div className={styles.swipeActions}>
              <Button icon={<X size={14} />} onClick={handleSwipeSkip} data-ai-action="skip-open-project">
                Skip
              </Button>
              <Button
                type="primary"
                icon={<Sparkles size={14} />}
                onClick={() => void handleSwipeJoin(swipeProjects[0].id)}
                data-ai-action="join-open-project"
              >
                Join
              </Button>
            </div>
            <p className={styles.swipeHint}>Drag cards left/right to quickly browse projects.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OpenProjectsPage;

