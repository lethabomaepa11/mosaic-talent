"use client";
import { useContext, useMemo, useReducer, type PropsWithChildren } from "react";
import { isAxiosError } from "axios";
import { getAxiosInstance } from "@/utils/axiosInstance";
import { normalizeProfile } from "../developer-provider/normalizers";
import type { IDeveloperProfile } from "../developer-provider/context";
import type { IProjectJoinLoadWarning } from "../project-provider/context";
import { buildError, buildPending, buildSuccess, buildInvitations, buildInvitationHandled } from "./actions";
import { BuildActionContext, BuildStateContext, INITIAL_STATE, type BuildActions, type Contribution, type BuildInvitation } from "./context";
import { BuildReducer } from "./reducer";
import { normalizeBuild, type BuildEnvelope } from "./normalizers";
const endpoint = "/api/services/app/BuildJourney";
const projects = "/api/services/app/DeveloperProject";

export const BuildProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(BuildReducer, INITIAL_STATE);
  const actions = useMemo<BuildActions>(() => {
    const api = getAxiosInstance();
    const run = async <T,>(operation: () => Promise<T>): Promise<T> => {
      dispatch(buildPending());
      try { const value = await operation(); dispatch(buildSuccess({})); return value; }
      catch (error) {
        const message = isAxiosError(error) ? error.response?.data?.error?.message || "We could not load this. Please try again."
          : error instanceof Error ? error.message : "Something went wrong. Please try again.";
        dispatch(buildError(message)); throw new Error(message);
      }
    };
    const loadBuild = async (projectId: string) => {
      const response = await api.get(`${endpoint}/GetBuild`, { params: { projectId } });
      const selected = normalizeBuild(response.data.result);
      dispatch(buildSuccess({ selected })); return selected;
    };
    const update = (name: string, data: unknown) => run(async () => {
      const response = await api.post(`${endpoint}/${name}`, data);
      const selected = normalizeBuild(response.data.result);
      dispatch(buildSuccess({ selected })); return selected;
    });
    const loadInvitations = async () => {
      const response = await api.get(`${endpoint}/GetMyInvitations`);
      dispatch(buildInvitations(response.data.result as BuildInvitation[]));
    };
    return {
      loadInvitations,
      inviteMember: (projectId, userName) => run(async () => {
        await api.post(`${endpoint}/InviteMember`, { projectId, userName });
      }),
      declineInvite: (projectId, inviteId) => run(async () => {
        await api.post(`${projects}/RejectProjectInvite`, { projectId, inviteId });
        dispatch(buildInvitationHandled(inviteId));
        await loadInvitations().catch(() => undefined);
      }),
      loadHome: () => run(async () => {
        const response = await api.get(`${endpoint}/GetHome`);
        const result = response.data.result as { profile: IDeveloperProfile; developerId: string; myProjects: BuildEnvelope[]; openProjects: BuildEnvelope[] };
        dispatch(buildSuccess({ profile: normalizeProfile(result.profile), developerId: result.developerId,
          mine: result.myProjects.map(normalizeBuild), teams: result.openProjects.map(normalizeBuild) }));
      }),
      loadBuild: (projectId) => run(() => loadBuild(projectId)),
      loadContributions: () => run(async () => {
        const response = await api.get(`${endpoint}/GetMyContributions`);
        dispatch(buildSuccess({ contributions: response.data.result as Contribution[] }));
      }),
      createBuild: (input) => update("CreateBuild", input),
      createTask: async (input) => { await update("CreateTask", input); },
      claimTask: async (projectId, taskId) => { await update("ClaimTask", { projectId, taskId }); },
      setTaskStatus: async (projectId, taskId, status) => { await update("SetTaskStatus", { projectId, taskId, status }); },
      joinBuild: (projectId, confirmed = false) => run(async () => {
        if (!confirmed) {
          const response = await api.get(`${projects}/GetJoinProjectLoadWarning`, { params: { projectId } });
          const warning = response.data.result as IProjectJoinLoadWarning;
          if (warning.shouldWarn) return warning;
        }
        await api.post(`${projects}/JoinProject`, { projectId, confirmHighWorkload: confirmed });
        await loadBuild(projectId); return undefined;
      }),
      acceptInvite: (projectId, inviteId) => run(async () => {
        await api.post(`${projects}/AcceptProjectInvite`, { projectId, inviteId }); await loadBuild(projectId);
      }),
    };
  }, []);
  return <BuildStateContext.Provider value={state}><BuildActionContext.Provider value={actions}>{children}</BuildActionContext.Provider></BuildStateContext.Provider>;
};
export const useBuildState = () => useContext(BuildStateContext);
export const useBuildActions = () => {
  const actions = useContext(BuildActionContext);
  if (!actions) throw new Error("BuildProvider is required.");
  return actions;
};
