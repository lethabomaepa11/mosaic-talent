"use client";
import { createContext } from "react";
import type { IDeveloperProfile } from "../developer-provider/context";
import type { IProject, IProjectTask, IProjectJoinLoadWarning } from "../project-provider/context";

export interface BuildTask extends IProjectTask { isStarterTask: boolean; acceptanceCriteria: string; }
export interface BuildProject extends Omit<IProject, "tasks"> {
  purpose: number; firstOutcome: string; teamTimeZone: string; isMember: boolean;
  canManage: boolean; currentDeveloperId: string; pendingInviteId?: string; tasks: BuildTask[];
}
export interface Contribution {
  id: string; projectId: string; projectTitle: string; title: string; summary: string;
  evidenceUrl: string; createdAt: string; reviewCount: number;
}
export interface BuildInvitation { id: string; projectId: string; projectTitle: string; estimatedHoursPerWeek: number; }
export interface BuildState {
  isPending: boolean; error: string; profile?: IDeveloperProfile; developerId: string;
  mine: BuildProject[]; teams: BuildProject[]; selected?: BuildProject; contributions: Contribution[];
  invitations: BuildInvitation[];
}
export interface CreateBuild {
  title: string; problemStatement: string; description: string; firstOutcome?: string;
  purpose?: number; teamTimeZone?: string; estimatedHoursPerWeek: number; difficulty: number;
  isPublic: boolean; skills: string[]; githubRepo?: string;
  createStarterTask?: boolean;
}
export interface CreateBuildTask { projectId: string; title: string; description?: string; acceptanceCriteria?: string; isStarterTask: boolean; }
export interface BuildActions {
  loadHome(): Promise<void>;
  loadInvitations(): Promise<void>;
  inviteMember(projectId: string, userName: string): Promise<void>;
  declineInvite(projectId: string, inviteId: string): Promise<void>;
  loadBuild(projectId: string): Promise<BuildProject>;
  loadContributions(): Promise<void>;
  createBuild(input: CreateBuild): Promise<BuildProject>;
  createTask(input: CreateBuildTask): Promise<void>;
  claimTask(projectId: string, taskId: string): Promise<void>;
  setTaskStatus(projectId: string, taskId: string, status: string): Promise<void>;
  joinBuild(projectId: string, confirmed?: boolean): Promise<IProjectJoinLoadWarning | undefined>;
  acceptInvite(projectId: string, inviteId: string): Promise<void>;
}
export const INITIAL_STATE: BuildState = { isPending: false, error: "", developerId: "", mine: [], teams: [], contributions: [], invitations: [] };
export const BuildStateContext = createContext<BuildState>(INITIAL_STATE);
export const BuildActionContext = createContext<BuildActions | null>(null);
