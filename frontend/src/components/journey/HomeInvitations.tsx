"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, Button } from "antd";
import { useBuildActions, useBuildState } from "@/providers/build-provider";
import { useJourneyStyles } from "./styles";

export const HomeInvitations = () => {
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState("");
  const { styles } = useJourneyStyles();
  const { invitations } = useBuildState();
  const { loadInvitations, declineInvite } = useBuildActions();
  const load = () => loadInvitations().then(() => setFailure("")).catch(() => setFailure("Invitations could not be loaded."));
  useEffect(() => {
    const refresh = () => { if (!document.hidden) void load(); };
    void load();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const timer = window.setInterval(refresh, 30_000);
    return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); window.clearInterval(timer); };
  }, []);
  const decline = async (projectId: string, inviteId: string) => {
    setBusy(inviteId);
    try { await declineInvite(projectId, inviteId); }
    catch (error) { setFailure(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(""); }
  };
  if (!invitations.length && !failure) return null;
  return <section className={styles.stack} aria-label="Project invitations">
    <h2 className={styles.sectionTitle}>Invitations</h2>
    {failure && <Alert type="error" title={failure} action={<Button onClick={() => void load()}>Retry invitations</Button>}/>}
    {invitations.map(invite => <article className={styles.panel} key={invite.id}>
      <div className={styles.sectionHeader}>
        <div><strong>{invite.projectTitle}</strong><p className={styles.small}>{invite.estimatedHoursPerWeek}h per week · Invitation to join</p></div>
        <div className={styles.row}><Link href={`/app/build/${invite.projectId}?tab=overview`}><Button type="primary">Review invitation</Button></Link><Button loading={busy === invite.id} disabled={Boolean(busy)} onClick={() => void decline(invite.projectId, invite.id)}>Decline</Button></div>
      </div>
    </article>)}
  </section>;
};
