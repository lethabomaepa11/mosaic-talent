"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Input, Select, Skeleton } from "antd";
import { Search, Plus } from "lucide-react";
import { useBuildActions, useBuildState } from "@/providers/build-provider";
import { BuildCard } from "@/components/journey/BuildCard";
import { useJourneyStyles } from "@/components/journey/styles";
import { PURPOSES } from "@/lib/buildJourney";
import { useStyles } from "./style";

const FindTeamsPage = () => {
  const [query, setQuery] = useState("");
  const [purpose, setPurpose] = useState<number>();
  const [hours, setHours] = useState<number>();
  const { styles } = useStyles();
  const { styles: ui } = useJourneyStyles();
  const { teams, profile, isPending, error } = useBuildState();
  const { loadHome } = useBuildActions();
  useEffect(() => { void loadHome().catch(() => undefined); }, [loadHome]);

  const results = useMemo(() => teams.filter(project => {
    const text = [project.title, project.problemStatement, project.description, ...project.skills].join(" ").toLowerCase();
    return (!query.trim() || text.includes(query.trim().toLowerCase()))
      && (purpose === undefined || project.purpose === purpose)
      && (!hours || project.estimatedHoursPerWeek <= hours);
  }).sort((a, b) => a.estimatedHoursPerWeek - b.estimatedHoursPerWeek || a.title.localeCompare(b.title)), [teams, query, purpose, hours]);
  const clear = () => { setQuery(""); setPurpose(undefined); setHours(undefined); };

  return <div className={styles.page} data-ai-page="projects-open">
    <header className={ui.sectionHeader}>
      <div><h1 className={ui.title}>Find a project</h1><p className={ui.lead}>Public projects you can join. Check the skills, tasks, and time commitment.</p></div>
      <Link href="/app/projects/create"><Button icon={<Plus size={16}/>}>Create project</Button></Link>
    </header>
    {error && <Alert title={error} type="error" showIcon action={<Button onClick={() => void loadHome().catch(() => undefined)}>Try again</Button>}/>}
    <section className={styles.filters} aria-label="Project filters">
      <Input prefix={<Search size={17}/>} allowClear aria-label="Search projects" placeholder="Search by project, problem, or skill" value={query} onChange={event => setQuery(event.target.value)}/>
      <Select aria-label="Project goal" allowClear value={purpose} onChange={setPurpose} placeholder="Any project goal" options={PURPOSES.map((label, value) => ({ value, label }))}/>
      <Select aria-label="Weekly commitment" allowClear value={hours} onChange={setHours} placeholder="Any weekly commitment" options={[2, 4, 6, 10, 20].map(value => ({ value, label: `Up to ${value}h / week` }))}/>
    </section>
    <div className={ui.sectionHeader}><p className={ui.small}>{results.length} {results.length === 1 ? "project" : "projects"} · Lowest weekly commitment first</p><Link className={ui.link} href="/app/build-profile">Edit your preferences</Link></div>
    {isPending && !teams.length ? <Skeleton active paragraph={{ rows: 6 }}/> : results.length ? <div className={ui.projectList}>{results.map(project => <BuildCard key={project.id} project={project} profile={profile}/>)}</div> : !error && <section className={ui.empty}>
      <h2>{teams.length ? "No projects match these filters." : "No public projects are recruiting yet."}</h2>
      <p>{teams.length ? "Try another skill or remove a filter." : "Create a project and make it public so other developers can find it."}</p>
      <div className={ui.row}>{teams.length ? <Button onClick={clear}>Clear filters</Button> : <Link href="/app/projects/create"><Button type="primary">Create project</Button></Link>}<Link className={ui.link} href="/app/ideator">Browse ideas</Link></div>
    </section>}
  </div>;
};

export default FindTeamsPage;
