"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, Button, Skeleton } from "antd";
import { Plus } from "lucide-react";
import { useBuildActions, useBuildState } from "@/providers/build-provider";
import { complete } from "@/lib/buildJourney";
import { BuildCard } from "./BuildCard";
import { HomeInvitations } from "./HomeInvitations";
import { useJourneyStyles } from "./styles";
import { useStyles } from "@/app/app/style";

export const DeveloperHome = () => {
  const [showAllTasks, setShowAllTasks] = useState(false);
  const { styles } = useStyles();
  const { styles: ui } = useJourneyStyles();
  const { profile, mine, teams, isPending, error, developerId } = useBuildState();
  const { loadHome } = useBuildActions();
  useEffect(() => { void loadHome().catch(() => undefined); }, [loadHome]);

  const active = mine.filter(project => !complete(project.status));
  const tasks = active.flatMap(project => project.tasks
    .filter(task => task.assignedMemberId === developerId && task.status !== "done")
    .map(task => ({ project, task })));

  if (!profile && isPending) return <Skeleton active paragraph={{ rows: 6 }} />;

  return <div className={styles.journeyPage} data-ai-page="build-home">
    <header className={ui.sectionHeader}>
      <div><h1 className={ui.title}>Home</h1><p className={ui.muted}>{profile?.fullName ? `Hi ${profile.fullName.split(" ")[0]}. ` : ""}{active.length ? "Here’s what you’re working on." : "Find a project to join, or start one of your own."}</p></div>
      {active.length > 0 && <Link href="/app/projects/create"><Button icon={<Plus size={16}/>}>Create project</Button></Link>}
    </header>
    {error && <Alert type="error" showIcon title={error} action={<Button onClick={() => void loadHome().catch(() => undefined)}>Try again</Button>}/>}
    <HomeInvitations/>

    {active.length > 0 ? <>
      <section className={ui.stack} aria-labelledby="your-tasks-heading">
        <div className={ui.sectionHeader}><h2 id="your-tasks-heading" className={ui.sectionTitle}>Your tasks <span className={ui.small}>({tasks.length})</span></h2></div>
        <div className={styles.taskList}>
          {tasks.length ? (showAllTasks ? tasks : tasks.slice(0, 3)).map(({project, task}) => <article className={styles.taskRow} key={task.id}>
            <div><Link className={styles.taskTitle} href={`/app/build/${project.id}?tab=board&task=${task.id}#task-${task.id}`}>{task.title}</Link><p className={ui.small}>{project.title} · {task.status === "in-progress" ? "In progress" : "To do"}</p></div>
            <Link href={`/app/build/${project.id}?tab=board&task=${task.id}#task-${task.id}`}><Button>Open task</Button></Link>
          </article>) : <div className={styles.listEmpty}><p>You have no assigned tasks.</p><span>Open a project’s tasks below to choose or add one.</span></div>}
          {tasks.length > 3 && <Button type="text" aria-expanded={showAllTasks} onClick={() => setShowAllTasks(value => !value)}>{showAllTasks ? "Show fewer tasks" : `Show all ${tasks.length} tasks`}</Button>}
        </div>
      </section>
      <section className={ui.stack} aria-labelledby="your-projects-heading">
        <div className={ui.sectionHeader}><h2 id="your-projects-heading" className={ui.sectionTitle}>Your projects</h2><Link className={ui.link} href="/app/work">View all</Link></div>
        <div className={ui.projectList}>{active.slice(0, 3).map(project => <BuildCard key={project.id} project={project}/>)}</div>
      </section>
    </> : !error && !isPending && <section className={ui.empty}>
      <h2>You haven’t joined a project yet.</h2>
      <p>Explore projects by skills and weekly commitment. You can read the project and meet the team before joining.</p>
      <div className={ui.row}><Link href="/app/projects/open"><Button type="primary">Find a project</Button></Link><Link href="/app/projects/create"><Button>Create project</Button></Link></div>
      <Link className={ui.link} href="/app/ideator">Have an idea? Post it for discussion</Link>
    </section>}

    <section className={ui.stack} aria-labelledby="open-projects-heading">
      <div className={ui.sectionHeader}><h2 id="open-projects-heading" className={ui.sectionTitle}>Projects looking for teammates</h2><Link className={ui.link} href="/app/projects/open">Browse projects</Link></div>
      {teams.length ? <div className={ui.projectList}>{teams.slice(0, 3).map(project => <BuildCard key={project.id} project={project} profile={profile}/>)}</div> : !isPending && <p className={ui.muted}>No public projects are recruiting right now. <Link className={ui.link} href="/app/ideator">Discuss an idea</Link> or <Link className={ui.link} href="/app/projects/create">create a project</Link>.</p>}
    </section>
  </div>;
};
