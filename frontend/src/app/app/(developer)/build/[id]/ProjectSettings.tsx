"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Input, Modal } from "antd";
import type { BuildProject } from "@/providers/build-provider/context";
import { useBuildActions } from "@/providers/build-provider";
import { useProjectAction } from "@/providers/project-provider";
import { complete } from "@/lib/buildJourney";
import { useJourneyStyles } from "@/components/journey/styles";
import { toast } from "@/components/providers";

export const ProjectSettings = ({ project }: { project: BuildProject }) => {
  const [action, setAction] = useState<"leave" | "complete" | "delete">();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const lock = useRef(false);
  const router = useRouter();
  const { styles } = useJourneyStyles();
  const { loadBuild } = useBuildActions();
  const { completeProject, leaveProject, deleteProject } = useProjectAction();
  const finished = complete(project.status);
  const allDone = project.tasks.length > 0 && project.tasks.every(task => task.status === "done");
  const owner = project.ownerId === project.currentDeveloperId;
  const canLeave = project.members.length > 1 && (project.members.find(member => member.id === project.currentDeveloperId)?.role !== "lead"
    || project.members.some(member => member.id !== project.currentDeveloperId && member.role === "lead"));
  const confirm = async () => {
    if (!action || lock.current) return;
    lock.current = true; setBusy(true); setFailure("");
    try {
      if (action === "complete") {
        await completeProject(project.id); await loadBuild(project.id);
        toast.success("Project completed", "Your contributions remain available. You can now give your teammates peer feedback.");
      } else {
        if (action === "leave") await leaveProject(project.id, reason.trim());
        else await deleteProject(project.id);
        toast.success(action === "leave" ? "Left project" : "Project deleted");
        router.push("/app/work");
      }
      setAction(undefined);
    } catch (error) { setFailure(error instanceof Error ? error.message : "Please try again."); }
    finally { lock.current = false; setBusy(false); }
  };
  return <section className={styles.stack} aria-label="Project settings">
    <h2 className={styles.sectionTitle}>Project settings</h2>
    {finished ? <p className={styles.muted}>This project is complete. Tasks are read-only. You can still document contributions and give feedback.</p> : project.canManage && <div className={styles.panel}>
      <div className={styles.sectionHeader}><div><strong>Finish this project</strong><p className={styles.small}>{allDone ? "Every task is done. Complete the project when the team is ready." : "Finish all tasks before completing this project."}</p></div><Button disabled={!allDone} onClick={() => { setFailure(""); setAction("complete"); }}>Complete project</Button></div>
    </div>}
    {finished && <Link className={styles.link} href={`/app/reviews/${project.id}`}>Give peer feedback</Link>}
    <div className={styles.panel}><div className={styles.sectionHeader}><div><strong>Leave the team</strong><p className={styles.small}>{canLeave ? "Leave a handover note for your teammates." : project.members.length === 1 ? "You’re the only member. You can delete this project instead." : "Promote another teammate to project lead before leaving."}</p></div><Button disabled={!canLeave} onClick={() => { setFailure(""); setAction("leave"); }}>Leave project</Button></div></div>
    {owner && <div className={styles.panel}><div className={styles.sectionHeader}><div><strong>Delete project</strong><p className={styles.small}>Only the owner can delete a project, and only while they’re its sole member.</p></div><Button danger disabled={project.members.length !== 1} onClick={() => { setFailure(""); setAction("delete"); }}>Delete project</Button></div></div>}
    <details><summary>More project tools</summary><p className={styles.small}>Meetings, repository checks, complaints, and optional AI tools.</p><Link className={styles.link} href={`/app/projects/${project.id}?tools=1`}>Open additional tools</Link></details>
    <Modal open={Boolean(action)} title={action === "complete" ? "Complete this project?" : action === "leave" ? "Leave this project?" : "Delete this project?"}
      onCancel={() => { if (!busy) setAction(undefined); }} onOk={() => void confirm()} confirmLoading={busy}
      okText={action === "complete" ? "Complete project" : action === "leave" ? "Leave project" : "Delete project"}
      okButtonProps={{ danger: action !== "complete", disabled: action === "leave" && !reason.trim() }}>
      <div className={styles.stack}><p className={styles.muted}>{action === "complete" ? "This closes the task board and makes peer feedback available to eligible teammates." : action === "delete" ? "This removes the project and cannot be undone." : "Your team will receive your note. Explain any unfinished work and where to pick it up."}</p>
        {action === "leave" && <><label htmlFor="handover-note">Handover note</label><Input.TextArea id="handover-note" value={reason} onChange={event => setReason(event.target.value)} rows={4} maxLength={600}/></>}
        {failure && <Alert type="error" title={failure}/>}</div>
    </Modal>
  </section>;
};
