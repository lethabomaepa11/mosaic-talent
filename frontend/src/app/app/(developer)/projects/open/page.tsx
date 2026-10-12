"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Empty, Input, Modal, Select, Spin, Typography } from "antd";
import { Search } from "lucide-react";
import { toast } from "@/components/providers";
import { ProjectCard } from "@/components/project-card/ProjectCard";
import { ProjectMatchComparison } from "@/components/project-match-comparison/ProjectMatchComparison";
import { useDeveloperAction } from "@/providers/developer-provider";
import { useProjectAction, useProjectState } from "@/providers/project-provider";
import { IProjectJoinLoadWarning } from "@/providers/project-provider/context";
import { useStyles } from "./style";

const SWIPE_THRESHOLD = 120;

const OpenProjectsPage = () => {
  const [view, setView] = useState<"browse" | "swipe">("browse");
  const [searchText, setSearchText] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>();
  const [sortBy, setSortBy] = useState("newest");
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [joinWarning, setJoinWarning] = useState<{
    projectId: string;
    warning: IProjectJoinLoadWarning;
  } | null>(null);
  const [isJoiningProject, setIsJoiningProject] = useState(false);
  const { styles } = useStyles();

  const { fetchCurrentUser } = useDeveloperAction();
  const { openProjects, isPending } = useProjectState();
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
  const availableSkills = useMemo(
    () => [...new Set(openProjects.flatMap((project) => project.skills))].sort((a, b) => a.localeCompare(b)),
    [openProjects],
  );
  const visibleProjects = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase();
    const filtered = openProjects.filter((project) => {
      const searchableText = [project.title, project.description, project.type, project.githubRepo, ...project.skills]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      return (!query || searchableText.includes(query))
        && selectedSkills.every((skill) => project.skills.some((projectSkill) => projectSkill.toLocaleLowerCase() === skill.toLocaleLowerCase()))
        && (!selectedDifficulty || project.difficulty === selectedDifficulty);
    });
    return filtered.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "workload") return a.estimatedHoursPerWeek - b.estimatedHoursPerWeek;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [openProjects, searchText, selectedSkills, selectedDifficulty, sortBy]);
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
            Browse every open collaboration, or use the swipe view to review projects one at a time.
          </Typography.Paragraph>
        </div>
        <div className={styles.actionRow}>
          <Button type={view === "browse" ? "primary" : "default"} onClick={() => setView("browse")}>Browse all</Button>
          <Button type={view === "swipe" ? "primary" : "default"} onClick={() => setView("swipe")}>Swipe view</Button>
          <Link href="/app/projects/my">
            <Button>Go to My Projects</Button>
          </Link>
        </div>
      </motion.div>

      <ProjectMatchComparison />

      {view === "browse" ? (
        <section className={styles.browseSection} aria-label="Browse open projects">
          <div className={styles.filters}>
            <Input
              allowClear
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search projects, skills, or technologies"
              prefix={<Search size={16} />}
              aria-label="Search open projects"
            />
            <Select
              mode="multiple"
              allowClear
              value={selectedSkills}
              onChange={setSelectedSkills}
              options={availableSkills.map((skill) => ({ label: skill, value: skill }))}
              placeholder="Filter by skills"
              aria-label="Filter by skills"
            />
            <Select
              allowClear
              value={selectedDifficulty}
              onChange={setSelectedDifficulty}
              options={["beginner", "intermediate", "advanced", "expert"].map((difficulty) => ({ label: difficulty, value: difficulty }))}
              placeholder="Any difficulty"
              aria-label="Filter by difficulty"
            />
            <Select
              value={sortBy}
              onChange={setSortBy}
              options={[
                { label: "Newest", value: "newest" },
                { label: "Oldest", value: "oldest" },
                { label: "Name A–Z", value: "title" },
                { label: "Lowest weekly hours", value: "workload" },
              ]}
              aria-label="Sort open projects"
            />
          </div>
          {isPending && openProjects.length === 0 ? <div className={styles.loading}><Spin /></div> : null}
          {!isPending && visibleProjects.length === 0 ? (
            <Empty description={openProjects.length ? "No projects match these filters." : "No open projects are available right now."} />
          ) : (
            <div className={styles.projectGrid}>
              {visibleProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onJoin={() => { void handleSwipeJoin(project.id); }}
                />
              ))}
            </div>
          )}
          <Typography.Text type="secondary" className={styles.resultCount}>
            Showing {visibleProjects.length} of {openProjects.length} open projects
          </Typography.Text>
        </section>
      ) : <div className={styles.swipeBoard}>
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
      </div>}
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

