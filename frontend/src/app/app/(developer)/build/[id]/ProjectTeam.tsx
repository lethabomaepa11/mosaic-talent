"use client";

import Link from "next/link";
import { Avatar } from "antd";
import type { BuildProject } from "@/providers/build-provider/context";
import { useJourneyStyles } from "@/components/journey/styles";
import { useStyles } from "./style";
import { TeamInvitations } from "./TeamInvitations";
import { TeamMemberControls } from "./TeamMemberControls";
import { complete } from "@/lib/buildJourney";
import { TeamFeedback } from "./TeamFeedback";

export const ProjectTeam = ({ project }: { project: BuildProject }) => {
  const { styles } = useStyles();
  const { styles: ui } = useJourneyStyles();

  return <section className={ui.stack}>
    <div className={ui.sectionHeader}><h2 className={ui.sectionTitle}>Team ({project.members.length})</h2></div>
    {project.isMember && <TeamFeedback projectId={project.id}/>}
    <div className={styles.people}>{project.members.map(member => <article className={styles.member} key={member.id}>
      <Avatar src={member.avatar || undefined} size={36}>{member.name.slice(0, 1)}</Avatar>
      <div>{member.userName ? <Link className={ui.link} href={`/developers/${member.userName}`}>{member.name}</Link> : <strong>{member.name}</strong>}<p className={ui.small}>{member.role === "lead" ? "Project lead" : "Member"}{member.isMentor ? " · Mentor" : ""}</p>
        {project.canManage && <TeamMemberControls project={project} member={member}/>}</div>
    </article>)}</div>
    {project.canManage && !complete(project.status) && <TeamInvitations projectId={project.id}/>}
  </section>;
};
