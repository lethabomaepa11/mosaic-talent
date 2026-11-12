import type { BuildProject, BuildTask } from "./context";
import type { IProject } from "../project-provider/context";

export interface BuildEnvelope {
  project: IProject; purpose?: number; firstOutcome?: string; teamTimeZone?: string;
  isMember?: boolean; canManage?: boolean; currentDeveloperId?: string; pendingInviteId?: string;
  taskDetails?: { id: string; isStarterTask?: boolean; acceptanceCriteria?: string }[];
}
export const normalizeBuild = (input: BuildEnvelope): BuildProject => ({
  ...input.project, skills: input.project.skills ?? [], members: input.project.members ?? [],
  purpose: Number(input.purpose ?? 0), firstOutcome: input.firstOutcome ?? "", teamTimeZone: input.teamTimeZone ?? "",
  isMember: input.isMember === true, canManage: input.canManage === true,
  currentDeveloperId: input.currentDeveloperId ?? "", pendingInviteId: input.pendingInviteId || undefined,
  tasks: (input.project.tasks ?? []).map((task): BuildTask => {
    const details = input.taskDetails?.find((entry) => entry.id === task.id);
    return { ...task, isStarterTask: details?.isStarterTask === true, acceptanceCriteria: details?.acceptanceCriteria ?? "" };
  }),
});
