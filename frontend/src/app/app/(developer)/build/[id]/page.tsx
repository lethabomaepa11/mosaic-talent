"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Checkbox, Modal, Skeleton, Tabs } from "antd";
import { ArrowLeft } from "lucide-react";
import { useBuildActions, useBuildState } from "@/providers/build-provider";
import { toast } from "@/components/providers";
import { useJourneyStyles } from "@/components/journey/styles";
import { ProjectKnowledgeWorkspace } from "@/app/app/(developer)/projects/[id]/ProjectKnowledgeWorkspace";
import ProjectProgress from "@/components/project-progress/ProjectProgress";
import { complete } from "@/lib/buildJourney";
import { BuildBoard } from "./BuildBoard";
import { ProjectOverview } from "./ProjectOverview";
import { ProjectTeam } from "./ProjectTeam";
import { ProjectSettings } from "./ProjectSettings";
import { useStyles } from "./style";

const BuildWorkspacePage = () => {
  const [joining, setJoining] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [warning, setWarning] = useState("");
  const [failure, setFailure] = useState("");
  const { id } = useParams<{ id: string }>();
  const query = useSearchParams();
  const router = useRouter();
  const { styles } = useStyles();
  const { styles: ui } = useJourneyStyles();
  const { selected, isPending, error } = useBuildState();
  const { loadBuild, joinBuild, acceptInvite } = useBuildActions();
  useEffect(() => { void loadBuild(id).catch(() => undefined); }, [id]);

  const project = selected?.id === id ? selected : undefined;
  const requestedTab = query.get("tab") === "tasks" ? "board" : query.get("tab");
  const tab = requestedTab && ["board", "overview", "team", "resources", ...(project?.isMember ? ["work", "settings"] : [])].includes(requestedTab)
    ? requestedTab : project?.isMember ? "board" : "overview";
  const focusedTask = project?.tasks.find(task => task.id === query.get("task"));
  const openTab = (key: string, taskId?: string) => router.replace(`/app/build/${id}?tab=${key}${taskId ? `&task=${taskId}#task-${taskId}` : ""}`, { scroll: false });
  const join = async () => {
    try {
      setFailure("");
      const result = project?.pendingInviteId ? await acceptInvite(id, project.pendingInviteId) : await joinBuild(id, Boolean(warning));
      if (result?.shouldWarn) { setWarning(result.message || "Check that you have time for this project alongside your existing commitments."); return; }
      setJoining(false);
      toast.success("Joined project", "You can now assign yourself a task and access team resources.");
      openTab("board");
    } catch (error) { setFailure(error instanceof Error ? error.message : "Please try again."); }
  };

  if (!project) return error ? <Alert type="error" showIcon title={error} action={<Button onClick={() => void loadBuild(id).catch(() => undefined)}>Try again</Button>}/> : <Skeleton active paragraph={{ rows: 8 }}/>;

  return <div className={styles.page} data-ai-page="build-workspace">
    <Link href={project.isMember ? "/app/work" : "/app/projects/open"} className={styles.back}><ArrowLeft size={15}/>{project.isMember ? "My projects" : "Find a project"}</Link>
    {error && <Alert type="error" title={error} showIcon/>}
    <header className={styles.header}>
      <div><h1 className={styles.heading}>{project.title}</h1><div className={styles.meta}><span>{project.isPublic ? "Public" : "Private"}</span><span>{project.estimatedHoursPerWeek}h / week</span><span>{project.members.length} {project.members.length === 1 ? "member" : "members"}</span><span>{complete(project.status) ? "Completed" : "Active"}</span></div></div>
      <div className={styles.actionRow}>
        {project.pendingInviteId && !project.isMember ? <Button type="primary" onClick={() => setJoining(true)}>Accept invitation</Button> : !project.isMember && project.isPublic && !complete(project.status) ? <Button type="primary" onClick={() => setJoining(true)}>Join project</Button> : null}
        {project.isMember && <Button onClick={() => openTab("settings")}>Project settings</Button>}
      </div>
    </header>
    <Tabs className={styles.tabs} activeKey={tab} onChange={key => openTab(key)} items={[{ key: "board", label: "Tasks" }, { key: "overview", label: "Overview" }, { key: "team", label: "Team" }, { key: "resources", label: "Resources" }, ...(project.isMember ? [{key:"work",label:"Work & feedback"},{key:"settings",label:"Settings"}] : [])]}/>
    {tab === "overview" && <ProjectOverview project={project} openTasks={() => openTab("board")}/>}
    {tab === "board" && <BuildBoard project={project} focusedTaskId={focusedTask?.id} onShare={task => openTab("work", task?.id)}/>}
    {tab === "team" && <ProjectTeam project={project}/>}
    {tab === "resources" && (project.isMember ? <ProjectKnowledgeWorkspace projectId={id} canEdit/> : <p className={ui.muted}>Join this project to access setup notes, decisions, and team resources.</p>)}

    {tab === "work" && project.isMember && <ProjectProgress key={`${id}-${focusedTask?.id || "general"}`} projectId={id} developerId={project.currentDeveloperId} canReview initialWork={focusedTask ? {id:focusedTask.id,title:focusedTask.title,summary:focusedTask.description || focusedTask.acceptanceCriteria} : undefined}/>}
    {tab === "settings" && project.isMember && <ProjectSettings project={project}/>}
    {tab === "board" && project.canManage && project.members.length === 1 && !complete(project.status) && <p className={ui.small}>Ready to build together? <Button type="link" onClick={() => openTab("team")}>Invite a teammate</Button></p>}
    <Modal title={`Join ${project.title}?`} open={joining} onCancel={() => { if (!isPending) { setJoining(false); setWarning(""); setConfirmed(false); } }} onOk={() => void join()} confirmLoading={isPending} okText={warning ? "Confirm and join" : project.pendingInviteId ? "Accept invitation" : "Join project"} okButtonProps={{ disabled: !confirmed }}>
      <div className={ui.stack}><p className={ui.muted}>The team expects around {project.estimatedHoursPerWeek} hours per person each week.</p>
        {warning && <Alert type="warning" showIcon title="Check your current workload" description={warning}/>}
        <Checkbox checked={confirmed} onChange={event => setConfirmed(event.target.checked)}>I can contribute {project.estimatedHoursPerWeek} hours a week.</Checkbox>
        {failure && <Alert type="error" title={failure}/>}<p className={ui.small}>If your availability changes, you can leave the project with a handover note.</p>
      </div>
    </Modal>
  </div>;
};

const BuildPage = () => <Suspense fallback={<Skeleton active/>}><BuildWorkspacePage/></Suspense>;
export default BuildPage;
