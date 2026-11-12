"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, Button, Skeleton, Tabs } from "antd";
import { ArrowUpRight, Plus } from "lucide-react";
import { useBuildActions, useBuildState } from "@/providers/build-provider";
import { BuildCard } from "@/components/journey/BuildCard";
import { useJourneyStyles } from "@/components/journey/styles";
import { complete } from "@/lib/buildJourney";
import { useStyles } from "./style";

const YourWorkPage = () => {
  const [chosenTab, setTab] = useState<string>();
  const query = useSearchParams();
  const { styles } = useStyles();
  const { styles: ui } = useJourneyStyles();
  const { mine, contributions, isPending, error } = useBuildState();
  const { loadHome, loadContributions } = useBuildActions();
  const reload = useCallback(async () => { await loadHome(); await loadContributions(); }, [loadHome, loadContributions]);
  useEffect(() => { void reload().catch(() => undefined); }, [reload]);
  const tab = chosenTab ?? (query.get("tab") === "contributions" ? "contributions" : query.get("tab") === "finished" ? "finished" : "active");
  const projects = mine.filter(project => complete(project.status) === (tab === "finished"));

  return <div className={styles.page}>
    <header className={ui.sectionHeader}><div><h1 className={ui.title}>My projects</h1><p className={ui.lead}>Projects you’ve joined and work you’ve shared.</p></div><Link href="/app/projects/create"><Button icon={<Plus size={16}/>}>Create project</Button></Link></header>
    {error && <Alert type="error" showIcon title={error} action={<Button onClick={() => void reload().catch(() => undefined)}>Try again</Button>}/>}
    <Tabs activeKey={tab} onChange={setTab} items={[{ key: "active", label: "Active" }, { key: "finished", label: "Completed" }, { key: "contributions", label: "Contributions" }]}/>
    {isPending && !mine.length && !contributions.length ? <Skeleton active/> : tab === "contributions" ? <section className={ui.stack}>
      {contributions.length ? contributions.map(entry => <article className={ui.panel} key={entry.id}>
        <div className={ui.sectionHeader}>{mine.some(project => project.id === entry.projectId) ? <Link className={ui.link} href={`/app/build/${entry.projectId}?tab=work`}>{entry.projectTitle}</Link> : <span>{entry.projectTitle}</span>}<time className={ui.small} dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleDateString()}</time></div>
        <h2 className={ui.sectionTitle}>{entry.title}</h2><p className={styles.summary}>{entry.summary}</p>
        <div className={ui.row}><span className={ui.small}>{entry.reviewCount} {entry.reviewCount === 1 ? "review" : "reviews"}</span>{/^https?:\/\//i.test(entry.evidenceUrl) && <a className={ui.link} href={entry.evidenceUrl} target="_blank" rel="noopener noreferrer">View work <ArrowUpRight size={14}/></a>}</div>
      </article>) : <div className={ui.empty}><h2>No contributions shared yet.</h2><p>Open a project and choose “Share work” to add a link and describe your contribution.</p><Link href="/app/projects/open"><Button>Find a project</Button></Link></div>}
    </section> : projects.length ? <section className={ui.projectList}>{projects.map(project => <BuildCard project={project} key={project.id}/>)}</section> : <div className={ui.empty}>
      <h2>{tab === "active" ? "No active projects." : "No completed projects."}</h2><p>{tab === "active" ? "Find a project to join or create one of your own." : "Projects marked complete by the team will appear here."}</p><Link href="/app/projects/open"><Button type="primary">Find a project</Button></Link>
    </div>}
  </div>;
};

const WorkPage = () => <Suspense fallback={<Skeleton active/>}><YourWorkPage/></Suspense>;
export default WorkPage;
