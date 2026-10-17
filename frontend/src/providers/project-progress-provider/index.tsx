"use client";

import { PropsWithChildren, useCallback, useContext, useMemo, useReducer } from "react";
import { AxiosError } from "axios";
import { getAxiosInstance } from "@/utils/axiosInstance";
import {
  ICreateProjectProgressEntryInput,
  INITIAL_STATE,
  IProjectProgressEntry,
  IProjectProgressReview,
  ProjectProgressActionContext,
  ProjectProgressStateContext,
} from "./context";
import { ProjectProgressReducer } from "./reducer";
import { fetchError, fetchPending, fetchSuccess, saveError, savePending } from "./actions";

const ENDPOINT = "/api/services/app/ProjectProgress";

const readError = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) return error.response?.data?.error?.message ?? fallback;
  return error instanceof Error ? error.message : fallback;
};

const normalizeEntry = (input: Partial<IProjectProgressEntry>): IProjectProgressEntry => ({
  id: String(input.id ?? ""),
  projectId: String(input.projectId ?? ""),
  developerId: String(input.developerId ?? ""),
  authorName: input.authorName ?? "Developer",
  title: input.title ?? "",
  summary: input.summary ?? "",
  evidenceUrl: input.evidenceUrl ?? "",
  selfReview: input.selfReview ?? "",
  createdAt: input.createdAt ?? "",
  reviews: (input.reviews ?? []).map((review: IProjectProgressReview) => ({
    id: String(review.id ?? ""),
    reviewerDeveloperId: String(review.reviewerDeveloperId ?? ""),
    reviewerName: review.reviewerName ?? "Teammate",
    reviewerRole: review.reviewerRole === "mentor" ? "mentor" : "teammate",
    comment: review.comment ?? "",
    createdAt: review.createdAt ?? "",
  })),
});

const normalizeList = (input: unknown): IProjectProgressEntry[] =>
  Array.isArray(input) ? input.map((item) => normalizeEntry(item as Partial<IProjectProgressEntry>)) : [];

export const ProjectProgressProvider = ({ children }: PropsWithChildren) => {
  const instance = useMemo(() => getAxiosInstance(), []);
  const [state, dispatch] = useReducer(ProjectProgressReducer, INITIAL_STATE);

  const fetchProjectEntries = useCallback(async (projectId: string) => {
    dispatch(fetchPending());
    try {
      const response = await instance.get(`${ENDPOINT}/GetProjectProgressEntries`, { params: { projectId } });
      const entries = normalizeList(response.data?.result);
      dispatch(fetchSuccess(entries));
      return entries;
    } catch (error) {
      dispatch(fetchError());
      throw new Error(readError(error, "Failed to load work evidence."));
    }
  }, [instance]);

  const createEntry = async (input: ICreateProjectProgressEntryInput) => {
    dispatch(savePending());
    try {
      const response = await instance.post(`${ENDPOINT}/CreateProjectProgressEntry`, input);
      const entry = normalizeEntry((response.data?.result ?? {}) as Partial<IProjectProgressEntry>);
      await fetchProjectEntries(input.projectId);
      return entry;
    } catch (error) {
      dispatch(saveError());
      throw new Error(readError(error, "Failed to save work evidence."));
    }
  };

  const reviewEntry = async (entryId: string, comment: string) => {
    dispatch(savePending());
    try {
      const response = await instance.post(`${ENDPOINT}/ReviewProjectProgressEntry`, { entryId, comment });
      const entry = normalizeEntry((response.data?.result ?? {}) as Partial<IProjectProgressEntry>);
      await fetchProjectEntries(entry.projectId);
      return entry;
    } catch (error) {
      dispatch(saveError());
      throw new Error(readError(error, "Failed to save progress feedback."));
    }
  };

  return (
    <ProjectProgressStateContext.Provider value={state}>
      <ProjectProgressActionContext.Provider value={{ fetchProjectEntries, createEntry, reviewEntry }}>
        {children}
      </ProjectProgressActionContext.Provider>
    </ProjectProgressStateContext.Provider>
  );
};

export const useProjectProgressState = () => useContext(ProjectProgressStateContext);
export const useProjectProgressAction = () => useContext(ProjectProgressActionContext);
