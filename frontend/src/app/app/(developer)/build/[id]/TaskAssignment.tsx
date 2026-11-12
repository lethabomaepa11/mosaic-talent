"use client";
import { useRef, useState } from "react";
import { Alert, Select } from "antd";
import { useProjectAction } from "@/providers/project-provider";
import { useBuildActions } from "@/providers/build-provider";
import type { BuildProject, BuildTask } from "@/providers/build-provider/context";
import { useJourneyStyles } from "@/components/journey/styles";

export const TaskAssignment = ({ project, task }: { project: BuildProject; task: BuildTask }) => {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const lock = useRef(false);
  const { styles } = useJourneyStyles();
  const { reassignProjectTask } = useProjectAction();
  const { loadBuild } = useBuildActions();
  const assign = async (developerId: string) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setFailure("");
    try { await reassignProjectTask(project.id, task.id, developerId || undefined); await loadBuild(project.id); }
    catch (error) { setFailure(error instanceof Error ? error.message : "Assignment could not be updated."); }
    finally { lock.current = false; setBusy(false); }
  };
  return <div className={styles.stack}>
    <Select virtual={false} aria-label={`Assignee of ${task.title}`} value={task.assignedMemberId || ""} disabled={busy} onChange={value => void assign(value)}
      options={[{value:"",label:"Unassigned"},...project.members.map(member=>({value:member.id,label:member.id === project.currentDeveloperId ? `${member.name} (you)` : member.name}))]}/>
    {failure && <Alert type="error" title={failure}/>}
  </div>;
};
