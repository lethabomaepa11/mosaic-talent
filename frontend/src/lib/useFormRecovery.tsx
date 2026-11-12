"use client";
import { useState } from "react";
import { clearFormDraft, readFormDraft, writeFormDraft } from "./formDraft";
import { useDraftSnapshot } from "./useDraftSnapshot";

export const useFormRecovery = <T extends object>(key: string, initial: T) => {
  const [edited, setEdited] = useState<{key:string;values:T}>();
  const snapshot = useDraftSnapshot(key);
  const cached = snapshot ? readFormDraft<T>(key) : {};
  const recovered = Object.fromEntries(Object.entries(cached).filter(([name,value]) => name in initial && typeof value === typeof initial[name as keyof T]));
  const values: T = edited?.key === key ? edited.values : { ...initial, ...recovered };
  return { values, restored: Boolean(snapshot) && edited?.key !== key,
    update: (change: Partial<T>) => {
      const next = { ...values, ...change };
      setEdited({key,values:next});
      if (key) writeFormDraft(key, next);
    },
    clear: () => { if (key) clearFormDraft(key); setEdited({key,values:initial}); },
  };
};
