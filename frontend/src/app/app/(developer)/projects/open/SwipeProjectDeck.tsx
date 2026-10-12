"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Empty } from "antd";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { ProjectCard } from "@/components/project-card/ProjectCard";
import { IProject } from "@/providers/project-provider/context";
import { useStyles } from "./style";

const SWIPE_THRESHOLD = 120;

interface ISwipeProjectDeckProps {
  projects: IProject[];
  swipeIndex: number;
  isJoiningProject: boolean;
  onJoin: (projectId: string) => void;
  onSkip: () => void;
  onBrowse: () => void;
  onRestart: () => void;
}

export const SwipeProjectDeck = ({
  projects,
  swipeIndex,
  isJoiningProject,
  onJoin,
  onSkip,
  onBrowse,
  onRestart,
}: ISwipeProjectDeckProps) => {
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const { styles } = useStyles();
  const swipeProjects = projects.slice(swipeIndex, swipeIndex + 3);
  const currentProject = swipeProjects[0];
  const cx = (...values: Array<string | false | undefined>) => values.filter(Boolean).join(" ");

  return (
    <section className={styles.swipeBoard} aria-label="Review projects one at a time">
      {currentProject ? (
        <>
          <div className={styles.swipeIntro}>
            <p className={styles.swipeProgress}>Project {swipeIndex + 1} of {projects.length}</p>
            <p className={styles.swipeHint}>Review the skills and team, then choose whether to join.</p>
          </div>
          <div className={styles.swipeStack}>
            <AnimatePresence>
              {swipeProjects.slice().reverse().map((project, index) => {
                const isTop = index === swipeProjects.length - 1;
                const visualOffset = (swipeProjects.length - 1 - index) * 10;

                return (
                  <motion.div
                    key={project.id}
                    className={cx(styles.swipeCard, isTop && styles.swipeCardTop)}
                    initial={false}
                    animate={{ opacity: 1, y: visualOffset, scale: 1 - visualOffset * 0.01 }}
                    exit={{ opacity: 0, x: 260, rotate: 12 }}
                    drag={isTop && !isJoiningProject ? "x" : false}
                    dragElastic={0.18}
                    dragConstraints={{ left: 0, right: 0 }}
                    onDrag={(_, info) => {
                      if (isTop) setDragOffsetX(info.offset.x);
                    }}
                    onDragEnd={(_, info) => {
                      if (isJoiningProject) {
                        setDragOffsetX(0);
                        return;
                      }
                      if (info.offset.x > SWIPE_THRESHOLD) onJoin(project.id);
                      if (info.offset.x < -SWIPE_THRESHOLD) onSkip();
                      setDragOffsetX(0);
                    }}
                  >
                    {isTop ? (
                      <div className={styles.swipeOverlayWrap}>
                        <span className={cx(styles.swipeOverlay, styles.swipeOverlayLike, dragOffsetX > 28 && styles.swipeOverlayVisible)}>JOIN</span>
                        <span className={cx(styles.swipeOverlay, styles.swipeOverlayNope, dragOffsetX < -28 && styles.swipeOverlayVisible)}>PASS</span>
                      </div>
                    ) : null}
                    <ProjectCard project={project} variant="swipe" hideActions />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          <div className={styles.swipeActionBar}>
            <Button icon={<ArrowLeft size={16} />} onClick={onSkip} disabled={isJoiningProject} aria-label="Pass on project">
              Pass for now
            </Button>
            <Button type="primary" icon={<ArrowRight size={16} />} onClick={() => onJoin(currentProject.id)} loading={isJoiningProject} aria-label="Join project team">
              Join this team
            </Button>
          </div>
          <p className={styles.swipeHint}>You can also swipe left to pass or right to join.</p>
        </>
      ) : (
        <div className={styles.swipeEmpty}>
          <Empty description={projects.length ? "You've reviewed every open project." : "No open projects are available right now."} />
          <div className={styles.swipeActionBar}>
            {projects.length ? <Button icon={<RotateCcw size={16} />} onClick={onRestart}>Review again</Button> : null}
            <Button type="primary" onClick={onBrowse}>Browse all projects</Button>
          </div>
        </div>
      )}
    </section>
  );
};
