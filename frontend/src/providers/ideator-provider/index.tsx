"use client";
import { PropsWithChildren, useContext, useMemo, useReducer, useRef } from "react";
import { getAxiosInstance } from "@/utils/axiosInstance";
import { IdeaReaction, IIdeaPost, INITIAL_IDEATOR_STATE, IdeatorActionContext, IdeatorStateContext } from "./context";
import { ideatorError, ideatorPending, ideatorSuccess } from "./actions";
import { IdeatorReducer } from "./reducer";

const endpoint = "/api/services/app/Ideator";
export const IdeatorProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(IdeatorReducer, INITIAL_IDEATOR_STATE);
  const cachedIdeas = useRef<IIdeaPost[]>([]);
  const actions = useMemo(() => {
  const request = async <T,>(method: "get" | "post" | "delete", name: string, data?: unknown) => {
    const api = getAxiosInstance();
    const response = method === "get" ? await api.get(`${endpoint}/${name}`)
      : method === "delete" ? await api.delete(`${endpoint}/${name}`, { params: data })
      : await api.post(`${endpoint}/${name}`, data);
    return response.data.result as T;
  };
  const save = (ideas: IIdeaPost[]) => {
    cachedIdeas.current = ideas;
    dispatch(ideatorSuccess(ideas));
  };
  const fetchFeed = async () => {
    dispatch(ideatorPending());
    try { save(await request<IIdeaPost[]>("get", "GetFeed")); }
    catch (error) { dispatch(ideatorError()); throw error; }
  };
  const change = async (operation: () => Promise<IIdeaPost | undefined>, removedId?: string) => {
    dispatch(ideatorPending());
    let result: IIdeaPost | undefined;
    try { result = await operation(); }
    catch (error) { dispatch(ideatorError()); throw error; }
    const others = cachedIdeas.current.filter((idea) => idea.id !== (result?.id ?? removedId));
    const confirmedIdeas = result ? [result, ...others] : others;
    // A failed refresh must not turn a successful write into a retryable write error.
    try { save(await request<IIdeaPost[]>("get", "GetFeed")); }
    catch { save(confirmedIdeas); dispatch(ideatorError()); }
    return result;
  };
  return {
    fetchFeed,
    createIdea: async (input: { title: string; problemStatement: string; proposedSolution: string; isPublic: boolean }) => {
      await change(() => request<IIdeaPost>("post", "CreateIdea", input));
    },
    react: async (ideaPostId: string, type: IdeaReaction) => {
      await change(() => request<IIdeaPost>("post", "React", { ideaPostId, type }));
    },
    comment: async (ideaPostId: string, body: string) => {
      await change(() => request<IIdeaPost>("post", "Comment", { ideaPostId, body }));
    },
    convert: (ideaPostId: string, inviteInterestedDevelopers: boolean) =>
      change(() => request<IIdeaPost>("post", "ConvertToProject", { ideaPostId, inviteInterestedDevelopers })),
    deleteIdea: async (ideaPostId: string) => {
      await change(async () => { await request("delete", "DeleteIdea", { ideaPostId }); return undefined; }, ideaPostId);
    },
  };
  }, []);
  return <IdeatorStateContext.Provider value={state}>
    <IdeatorActionContext.Provider value={actions}>{children}</IdeatorActionContext.Provider>
  </IdeatorStateContext.Provider>;
};
export const useIdeatorState = () => useContext(IdeatorStateContext);
export const useIdeatorAction = () => useContext(IdeatorActionContext);
