"use client";
import { useSyncExternalStore } from "react";
import { draftEvent, getDraftSnapshot } from "./formDraft";

const subscribe = (listener: () => void) => {
  window.addEventListener("storage", listener);
  window.addEventListener(draftEvent, listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener(draftEvent, listener); };
};
export const useDraftSnapshot = (key: string) => useSyncExternalStore(subscribe, () => getDraftSnapshot(key), () => "");
