"use client";

import { Button } from "antd";
import type { BuildProject } from "@/providers/build-provider/context";
import { purposeLabel } from "@/lib/buildJourney";
import { useJourneyStyles } from "@/components/journey/styles";
import { useStyles } from "./style";

export const ProjectOverview = ({ project, openTasks }: { project: BuildProject; openTasks: () => void }) => {
  const { styles } = useStyles();
  const { styles: ui } = useJourneyStyles();
  const starter = project.tasks.find(task => task.isStarterTask && !task.assignedMemberId && task.status !== "done");

  return <div className={styles.overview}>
    <div className={ui.stack}>
      <section className={styles.detailsSection}><h2>Problem</h2><p className={styles.prose}>{project.problemStatement || "No problem statement added."}</p></section>
      <section className={styles.detailsSection}><h2>What we’re building</h2><p className={styles.prose}>{project.description}</p></section>
      <section className={styles.detailsSection}><h2>First milestone</h2><p className={styles.prose}>{project.firstOutcome || "Not set. Agree on a first milestone with your team."}</p></section>
      {starter && <section className={ui.panel}><h2 className={ui.sectionTitle}>Starter task available</h2><p className={ui.muted}>{starter.title}</p><Button onClick={openTasks}>View tasks</Button></section>}
    </div>
    <aside className={styles.projectFacts} aria-label="Project details">
      <h2 className={ui.sectionTitle}>Project details</h2>
      <dl><dt>Goal</dt><dd>{purposeLabel(project.purpose)}</dd><dt>Commitment</dt><dd>{project.estimatedHoursPerWeek} hours per person / week</dd><dt>Time zone</dt><dd>{project.teamTimeZone?.replaceAll("_", " ") || "Not specified"}</dd><dt>Skills</dt><dd>{project.skills.length ? project.skills.join(", ") : "Not specified"}</dd></dl>
      {project.purpose === 2 && <p className={ui.small}>This is a cofounder trial: work on a small project together before making a longer commitment.</p>}
    </aside>
  </div>;
};
