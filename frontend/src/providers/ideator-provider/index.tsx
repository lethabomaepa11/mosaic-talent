"use client";
import { PropsWithChildren, useContext, useMemo, useReducer } from "react";
import { getAxiosInstance } from "@/utils/axiosInstance";
import { IdeaReaction, IIdeaPost, INITIAL_IDEATOR_STATE, IdeatorActionContext, IdeatorStateContext } from "./context";
import { ideatorError, ideatorPending, ideatorSuccess } from "./actions";
import { IdeatorReducer } from "./reducer";
const endpoint = "/api/services/app/Ideator";
export const IdeatorProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(IdeatorReducer, INITIAL_IDEATOR_STATE);
  const request = async <T,>(method: "get" | "post" | "delete", name: string, data?: unknown) => {
    const api = getAxiosInstance();
    const response = method === "get" ? await api.get(`${endpoint}/${name}`) : method === "delete" ? await api.delete(`${endpoint}/${name}`, { params: data }) : await api.post(`${endpoint}/${name}`, data);
    return response.data.result as T;
  };
  const run = async (operation: () => Promise<IIdeaPost[]>) => {
    dispatch(ideatorPending());
    try { dispatch(ideatorSuccess(await operation())); } catch (error) { dispatch(ideatorError()); throw error; }
  };
  const actions = useMemo(() => ({
    fetchFeed: () => run(() => request<IIdeaPost[]>("get", "GetFeed")),
    createIdea: (input: { title: string; problemStatement: string; proposedSolution: string; isPublic: boolean }) => run(async () => { await request("post", "CreateIdea", input); return request<IIdeaPost[]>("get", "GetFeed"); }),
    react: (ideaPostId: string, type: IdeaReaction) => run(async () => { await request("post", "React", { ideaPostId, type }); return request<IIdeaPost[]>("get", "GetFeed"); }),
    comment: (ideaPostId: string, body: string) => run(async () => { await request("post", "Comment", { ideaPostId, body }); return request<IIdeaPost[]>("get", "GetFeed"); }),
    convert: async (ideaPostId: string, inviteInterestedDevelopers: boolean) => { let result: IIdeaPost | undefined; await run(async () => { result = await request<IIdeaPost>("post", "ConvertToProject", { ideaPostId, inviteInterestedDevelopers }); return request<IIdeaPost[]>("get", "GetFeed"); }); return result; },
    deleteIdea: (ideaPostId: string) => run(async () => { await request("delete", "DeleteIdea", { ideaPostId }); return request<IIdeaPost[]>("get", "GetFeed"); }),
  }), []);
  const stateContext = useMemo(() => ({ ...state }), [state]);
  return <IdeatorStateContext.Provider value={stateContext}><IdeatorActionContext.Provider value={actions}>{children}</IdeatorActionContext.Provider></IdeatorStateContext.Provider>;
};
export const useIdeatorState = () => useContext(IdeatorStateContext);
export const useIdeatorAction = () => useContext(IdeatorActionContext);
