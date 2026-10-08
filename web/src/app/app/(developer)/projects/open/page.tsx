"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Empty, Modal, Spin, Typography } from "antd";
import { toast } from "@/components/providers";
import { ProjectCard } from "@/components/project-card/ProjectCard";
import { useDeveloperAction } from "@/providers/developer-provider";
import { useProjectAction, useProjectState } from "@/providers/project-provider";
import { IProjectJoinLoadWarning } from "@/providers/project-provider/context";
import { useStyles } from "./style";

const SWIPE_THRESHOLD = 120;

const OpenProjectsPage = () => {
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [joinWarning, setJoinWarning] = useState<{
    projectId: string;
    warning: IProjectJoinLoadWarning;
  } | null>(null);
  const [isJoiningProject, setIsJoiningProject] = useState(false);
  const { styles } = useStyles();

  const { fetchCurrentUser } = useDeveloperAction();
  const { openProjects } = useProjectState();
  const { fetchOpenProjects, joinProject, getJoinProjectLoadWarning } = useProjectAction();

  useEffect(() => {
    fetchCurrentUser();
    fetchOpenProjects();
  }, []);

  useEffect(() => {
    setSwipeIndex(0);
  }, [openProjects.length]);
  useEffect(() => {
    setDragOffsetX(0);
  }, [swipeIndex]);
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

  const swipeProjects = useMemo(() => {
    return openProjects.slice(swipeIndex, swipeIndex + 3);
  }, [openProjects, swipeIndex]);
  const cx = (...values: Array<string | false | undefined>) => values.filter(Boolean).join(" ");

  const executeJoin = async (projectId: string, confirmHighWorkload = false) => {
    setIsJoiningProject(true);
    try {
      await joinProject(projectId, confirmHighWorkload);
      toast.success("Joined project", "You successfully joined this project.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to join project.";
      toast.error("Join failed", message);
    } finally {
      setSwipeIndex((prev) => prev + 1);
      setIsJoiningProject(false);
    }
  };

  const handleSwipeJoin = async (projectId: string) => {
    setIsJoiningProject(true);
    try {
      const warning = await getJoinProjectLoadWarning(projectId);
      if (warning?.shouldWarn) {
        setIsJoiningProject(false);
        setJoinWarning({ projectId, warning });
        return;
      }

      await executeJoin(projectId);
    } catch (error) {
      setIsJoiningProject(false);
      const message =
        error instanceof Error ? error.message : "Failed to evaluate workload.";
      toast.error("Join blocked", message);
    }
  };

  const handleSwipeSkip = () => {
    setSwipeIndex((prev) => prev + 1);
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
                        drag={isTop && !isJoiningProject ? "x" : false}
                        dragElastic={0.18}
                        dragConstraints={{ left: 0, right: 0 }}
                        onDrag={(_, info) => {
                          if (isTop) {
                            setDragOffsetX(info.offset.x);
                          }
                        }}
                        onDragEnd={(_, info) => {
                          if (isJoiningProject) {
                            setDragOffsetX(0);
                            return;
                          }

                          if (info.offset.x > SWIPE_THRESHOLD) {
                            setDragOffsetX(0);
                            void handleSwipeJoin(project.id);
                            return;
                          }

                          if (info.offset.x < -SWIPE_THRESHOLD) {
                            setDragOffsetX(0);
                            handleSwipeSkip();
                            return;
                          }

                          setDragOffsetX(0);
                        }}
                      >
                        {isTop ? (
                          <div className={styles.swipeOverlayWrap}>
                            <span
                              className={cx(
                                styles.swipeOverlay,
                                styles.swipeOverlayLike,
                                dragOffsetX > 28 && styles.swipeOverlayVisible,
                              )}
                            >
                              LIKE
                            </span>
                            <span
                              className={cx(
                                styles.swipeOverlay,
                                styles.swipeOverlayNope,
                                dragOffsetX < -28 && styles.swipeOverlayVisible,
                              )}
                            >
                              NOPE
                            </span>
                          </div>
                        ) : null}
                        <ProjectCard
                          project={project}
                          onJoin={() => {
                            if (!isJoiningProject) {
                              void handleSwipeJoin(project.id);
                            }
                          }}
                          variant="swipe"
                          hideActions
                        />
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>
            <p className={styles.swipeHint}>
              Swipe right to join. Swipe left to skip.
            </p>
          </>
        )}
      </div>
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
              const projectId = joinWarning?.projectId;
              setJoinWarning(null);
              if (projectId) {
                void executeJoin(projectId, true);
              }
            }}
          >
            Continue Anyway
          </Button>,
        ]}
      >
        <Typography.Paragraph>
          {joinWarning?.warning.message}
        </Typography.Paragraph>
        <Typography.Text type="secondary">
          Active projects: {joinWarning?.warning.activeProjects ?? 0} /{" "}
          {joinWarning?.warning.recommendedProjectLimit ?? 0}
        </Typography.Text>
        <br />
        <Typography.Text type="secondary">
          Workload score if you join: {joinWarning?.warning.proposedWorkloadScore ?? 0} /{" "}
          {joinWarning?.warning.recommendedWorkloadLimit ?? 0}
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
    </div>
  );
};

export default OpenProjectsPage;

