"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Select } from "antd";
import { useBuildActions } from "@/providers/build-provider";
import { useDeveloperAction } from "@/providers/developer-provider";
import type { IDeveloperSearchResult } from "@/providers/developer-provider/context";
import { useProjectAction } from "@/providers/project-provider";
import type { IProjectInvite } from "@/providers/project-provider/context";
import { useJourneyStyles } from "@/components/journey/styles";
import { toast } from "@/components/providers";

export const TeamInvitations = ({ projectId }: { projectId: string }) => {
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<string>();
  const [results, setResults] = useState<IDeveloperSearchResult[]>([]);
  const [invites, setInvites] = useState<IProjectInvite[]>([]);
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [failure, setFailure] = useState("");
  const lock = useRef(false);
  const { styles } = useJourneyStyles();
  const { inviteMember } = useBuildActions();
  const { searchPublicDevelopers } = useDeveloperAction();
  const { getProjectInvites } = useProjectAction();
  useEffect(() => {
    let active = true;
    void getProjectInvites(projectId).then(items => { if (active) setInvites(items); }).catch(() => { if (active) setFailure("Pending invitations could not be loaded."); });
    return () => { active = false; };
  }, [projectId]);
  useEffect(() => {
    let active = true;
    if (query.trim().length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const timer = setTimeout(() => {
      void searchPublicDevelopers(query.trim()).then(items => { if (active) setResults(items); })
        .catch(() => { if (active) { setResults([]); setFailure("Developer search is unavailable. Try again."); } })
        .finally(() => { if (active) setSearching(false); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [query]);
  const send = async () => {
    if (!chosen || lock.current) return;
    lock.current = true; setBusy(true); setFailure("");
    try {
      await inviteMember(projectId, chosen);
      setChosen(undefined); setQuery("");
      toast.success("Invitation sent", "Your teammate can review it on Home before joining.");
      setInvites(await getProjectInvites(projectId));
    } catch (error) { setFailure(error instanceof Error ? error.message : "Please try again."); }
    finally { lock.current = false; setBusy(false); }
  };
  return <section className={styles.panel} aria-label="Invite teammates">
    <div className={styles.stack}>
      <h3 className={styles.sectionTitle}>Invite a teammate</h3>
      <p className={styles.small}>Search by name or username. They’ll receive an invitation to review and accept.</p>
      <label htmlFor="invite-developer">Developer</label>
      <Select virtual={false} id="invite-developer" aria-label="Developer to invite" showSearch filterOption={false} allowClear value={chosen} searchValue={query}
        onSearch={setQuery} onChange={setChosen} loading={searching} placeholder="Type at least 2 characters"
        notFoundContent={searching ? "Searching…" : query.trim().length < 2 ? "Search for a developer" : "No developers found"}
        options={results.map(person => ({ value: person.userName, label: `${person.displayName} (@${person.userName})` }))}/>
      <div><Button type="primary" disabled={!chosen || busy} loading={busy} onClick={() => void send()}>Send invitation</Button></div>
      {failure && <Alert type="error" title={failure}/>}
      {invites.filter(invite => invite.status === "pending").map(invite => <p className={styles.small} key={invite.id}>{invite.developerName} · Invitation pending</p>)}
    </div>
  </section>;
};
