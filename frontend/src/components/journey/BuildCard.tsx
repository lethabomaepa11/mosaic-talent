"use client";

import Link from "next/link";
import { Avatar, Button } from "antd";
import type { BuildProject } from "@/providers/build-provider/context";
import type { IDeveloperProfile } from "@/providers/developer-provider/context";
import { complete, fitReasons, purposeLabel } from "@/lib/buildJourney";
import { useJourneyStyles } from "./styles";

export const BuildCard = ({ project, profile }: { project: BuildProject; profile?: IDeveloperProfile }) => {
  const { styles } = useJourneyStyles();
  const reasons = fitReasons(project, profile);
  const starters = project.tasks.filter(task => task.isStarterTask && !task.assignedMemberId && task.status !== "done").length;
  const finished = complete(project.status);

  return <article className={styles.card} data-testid="build-card">
    <div className={styles.cardBody}>
      <div className={styles.sectionHeader}>
        <h3><Link href={`/app/build/${project.id}?tab=overview`}>{project.title}</Link></h3>
        <span className={styles.small}>{project.isMember ? finished ? "Completed" : "Active" : purposeLabel(project.purpose)}</span>
      </div>
      <p className={styles.projectDescription}>{project.problemStatement?.trim() || project.description}</p>
      <div className={styles.projectMeta}>
        <span>{project.estimatedHoursPerWeek}h / week</span><span>{project.members.length} {project.members.length === 1 ? "member" : "members"}</span>
        {!project.isMember && <span>{project.difficulty ? project.difficulty.charAt(0).toUpperCase() + project.difficulty.slice(1) : "Experience level not specified"}</span>}
        {project.isMember && <span>{project.isPublic ? "Public" : "Private"}</span>}
        {starters > 0 && <span>{starters} {starters === 1 ? "starter task" : "starter tasks"}</span>}
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.row}>
          {project.skills.slice(0, 4).map(skill => <span key={skill} className={styles.pill}>{skill}</span>)}
          {project.members.length > 0 && <Avatar.Group size="small">{project.members.slice(0, 3).map(member => <Avatar key={member.id} src={member.avatar || undefined} alt={member.name}>{member.name.slice(0, 1)}</Avatar>)}</Avatar.Group>}
        </div>
        <Link href={`/app/build/${project.id}${project.isMember && !finished ? "?tab=board" : "?tab=overview"}`}><Button>{project.isMember && !finished ? "Open tasks" : "View project"}</Button></Link>
      </div>
      {reasons.length > 0 && <details className={styles.fit}><summary>Matches your preferences</summary><ul>{reasons.map(reason => <li key={reason}>{reason}</li>)}</ul></details>}
    </div>
  </article>;
};
