"use client";
import { useRef, useState } from "react";
import { Alert, Button, Input, Modal, Select } from "antd";
import type { BuildProject } from "@/providers/build-provider/context";
import type { IProjectMember } from "@/providers/project-provider/context";
import { useProjectAction } from "@/providers/project-provider";
import { useBuildActions } from "@/providers/build-provider";
import { useJourneyStyles } from "@/components/journey/styles";

export const TeamMemberControls = ({ project, member }: { project: BuildProject; member: IProjectMember }) => {
  const [removing, setRemoving] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const lock = useRef(false);
  const { styles } = useJourneyStyles();
  const { loadBuild } = useBuildActions();
  const { assignMemberRole, setProjectMemberMentor, removeProjectMember } = useProjectAction();
  const act = async (operation: () => Promise<unknown>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setFailure("");
    try { await operation(); setRemoving(false); await loadBuild(project.id); }
    catch (error) { setFailure(error instanceof Error ? error.message : "Please try again."); }
    finally { lock.current = false; setBusy(false); }
  };
  return <div className={styles.stack}>
    <div className={styles.row}>
      <Select virtual={false} aria-label={`Role of ${member.name}`} value={member.role} disabled={busy} onChange={role => void act(() => assignMemberRole(project.id, member.id, role))} options={[{value:"member",label:"Member"},{value:"lead",label:"Project lead"}]}/>
      <Button disabled={busy} onClick={() => void act(() => setProjectMemberMentor(project.id, member.id, !member.isMentor))}>{member.isMentor ? "Remove mentor role" : "Make mentor"}</Button>
      {member.id !== project.currentDeveloperId && member.id !== project.ownerId && <Button danger disabled={busy} onClick={() => setRemoving(true)}>Remove member</Button>}
    </div>
    {failure && !removing && <Alert type="error" title={failure}/>}
    <Modal open={removing} title={`Remove ${member.name}?`} onCancel={() => { if (!busy) setRemoving(false); }} onOk={() => void act(() => removeProjectMember(project.id, member.id, reason))} confirmLoading={busy} okText="Remove member" okButtonProps={{danger:true,disabled:!reason.trim()}}>
      <div className={styles.stack}><label htmlFor={`remove-${member.id}`}>Reason for removal</label><Input.TextArea id={`remove-${member.id}`} rows={3} maxLength={600} value={reason} onChange={event => setReason(event.target.value)}/>{failure && <Alert type="error" title={failure}/>}</div>
    </Modal>
  </div>;
};
