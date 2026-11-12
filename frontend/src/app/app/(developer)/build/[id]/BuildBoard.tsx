"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Checkbox, Input, Modal, Select } from "antd";
import { Plus } from "lucide-react";
import type { BuildProject, BuildTask } from "@/providers/build-provider/context";
import { useBuildActions, useBuildState } from "@/providers/build-provider";
import { toast } from "@/components/providers";
import { complete } from "@/lib/buildJourney";
import { useJourneyStyles } from "@/components/journey/styles";
import { useStyles } from "./style";
import { useAuthState } from "@/providers/auth-provider";
import { useFormRecovery } from "@/lib/useFormRecovery";
import { TaskAssignment } from "./TaskAssignment";

export const BuildBoard = ({ project, onShare, focusedTaskId }: { project: BuildProject; onShare: (task?: BuildTask) => void; focusedTaskId?: string }) => {
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState("all");
  const [failure, setFailure] = useState("");
  const lock = useRef(false);
  const { user } = useAuthState();
  const draft = useFormRecovery(user ? `${user.userId}.${project.id}.new-task` : "", {title:"",description:"",criteria:"",starter:true});
  const { title, description, criteria, starter } = draft.values;
  const { styles } = useStyles();
  const { styles: ui } = useJourneyStyles();
  const { createTask, claimTask, setTaskStatus } = useBuildActions();
  const { isPending } = useBuildState();
  useEffect(() => { if (focusedTaskId) document.getElementById(`task-${focusedTaskId}`)?.scrollIntoView({block:"center"}); }, [focusedTaskId]);

  const finished = complete(project.status);
  const tasks = project.tasks.filter(task => filter === "mine" ? task.assignedMemberId === project.currentDeveloperId : filter === "unassigned" ? !task.assignedMemberId : true);
  const act = async (operation: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    try { setFailure(""); await operation(); }
    catch (error) { setFailure(error instanceof Error ? error.message : "Please try again."); }
    finally { lock.current = false; }
  };
  const save = async () => {
    if (lock.current) return;
    lock.current = true;
    try {
      setFailure("");
      await createTask({ projectId: project.id, title, description, acceptanceCriteria: criteria, isStarterTask: starter });
      setAdding(false); draft.clear();
      toast.success("Task added", "The task is available on the board.");
    } catch (error) { setFailure(error instanceof Error ? error.message : "The task could not be saved."); }
    finally { lock.current = false; }
  };

  return <section className={ui.stack} aria-label="Team task board">
    <div className={ui.sectionHeader}>
      <Select virtual={false} className={styles.taskFilter} aria-label="Filter tasks" value={filter} onChange={setFilter} options={[{ value: "all", label: "All tasks" }, ...(project.isMember ? [{ value: "mine", label: "Assigned to me" }] : []), { value: "unassigned", label: "Unassigned" }]}/>
      {project.isMember && <div className={ui.row}><Button onClick={() => onShare()}>Share work</Button>{!finished && <Button type="primary" icon={<Plus size={16}/>} onClick={() => setAdding(true)}>Add task</Button>}</div>}
    </div>
    {failure && !adding && <Alert type="error" title={failure} showIcon/>}
    {!project.isMember && <p className={ui.small}>You can browse tasks. Join the project to contribute.</p>}
    {!tasks.length && <p className={styles.mobileEmpty}>{project.tasks.length ? "No tasks match this filter." : "No tasks have been added yet."}</p>}
    <div className={styles.board}>{[{ key: "todo", label: "To do" }, { key: "in-progress", label: "In progress" }, { key: "done", label: "Done" }].map(column => {
      const columnTasks = tasks.filter(task => task.status === column.key);
      return <section className={styles.column} data-empty={!columnTasks.length} key={column.key} aria-label={column.label}>
        <h2>{column.label} <span className={ui.small}>({columnTasks.length})</span></h2>
        {columnTasks.map(task => {
          const own = task.assignedMemberId === project.currentDeveloperId;
          return <article id={`task-${task.id}`} className={styles.task} data-focused={task.id === focusedTaskId} key={task.id}>
            {task.isStarterTask && task.status !== "done" && <span className={ui.small}>Good first task</span>}
            <h3>{task.title}</h3>
            {task.description && <p>{task.description}</p>}
            {task.acceptanceCriteria && <div><strong className={ui.small}>Acceptance criteria</strong><p>{task.acceptanceCriteria}</p></div>}
            <span className={ui.small}>{task.assignedMemberId ? `${task.assignedMemberName || "A teammate"}${own ? " (you)" : ""}` : "Unassigned"}</span>
            {project.canManage && !finished && <TaskAssignment project={project} task={task}/>}
            {project.isMember && !finished && !task.assignedMemberId && task.status !== "done" && <Button loading={isPending} onClick={() => void act(() => claimTask(project.id, task.id))}>Assign to me</Button>}
            {project.isMember && !finished && (own || project.canManage) && <Select virtual={false} aria-label={`Status of ${task.title}`} disabled={isPending} value={task.status} onChange={status => void act(() => setTaskStatus(project.id, task.id, status))} options={[{ value: "todo", label: "To do" }, { value: "in-progress", label: "In progress" }, { value: "done", label: "Done" }]}/>}
            {project.isMember && own && <Button onClick={() => onShare(task)}>Share work for this task</Button>}
          </article>;
        })}
        {!columnTasks.length && <p className={ui.small}>No tasks.</p>}
      </section>;
    })}</div>
    <Modal title="New task" open={adding} onCancel={() => { if (!isPending) setAdding(false); }} onOk={() => void save()} confirmLoading={isPending} okText="Add task" okButtonProps={{ disabled: !title.trim() || !criteria.trim() }}>
      <div className={styles.taskForm}>
        {draft.restored && <p className={ui.small}>Your unfinished task was restored.</p>}
        <div><label htmlFor="new-task-title">Task title</label><Input id="new-task-title" maxLength={180} placeholder="For example, Add a suburb filter" value={title} onChange={event => draft.update({title:event.target.value})}/></div>
        <div><label htmlFor="new-task-context">Description (optional)</label><Input.TextArea id="new-task-context" rows={3} maxLength={2000} value={description} onChange={event => draft.update({description:event.target.value})} placeholder="Explain the change and link to any useful files."/></div>
        <div><label htmlFor="new-task-done">Acceptance criteria</label><Input.TextArea id="new-task-done" rows={3} maxLength={2000} value={criteria} onChange={event => draft.update({criteria:event.target.value})} placeholder="How will the team know this task is complete?"/></div>
        <Checkbox checked={starter} onChange={event => draft.update({starter:event.target.checked})}>Good first task for a new teammate</Checkbox>
        {failure && <Alert type="error" title={failure}/>}
      </div>
    </Modal>
  </section>;
};
