"use client";
import { useEffect, useState } from "react";
import type { FormInstance } from "antd";
import { useAuthState } from "@/providers/auth-provider";
import { useDeveloperAction } from "@/providers/developer-provider";
import { clearFormDraft, readFormDraft, writeFormDraft } from "@/lib/formDraft";
import { useDraftSnapshot } from "@/lib/useDraftSnapshot";

export const useProjectDraft = (form: FormInstance) => {
  const [saved, setSaved] = useState(false);
  const { user } = useAuthState();
  const { fetchMyProfile } = useDeveloperAction();
  const key = user ? `${user.userId}.new-project` : "";
  const snapshot = useDraftSnapshot(key);
  useEffect(() => {
    if (!key) return;
    let active = true;
    const cached = readFormDraft<Record<string, unknown>>(key);
    if (Object.keys(cached).length) form.setFieldsValue(cached);
    void fetchMyProfile().then(profile => {
      if (!active || !profile || profile.userId !== user?.userId) return;
      const defaults = { skills: profile.skills.join(", "), estimatedHoursPerWeek: profile.weeklyHours ?? 4,
        purpose: profile.collaborationIntent ?? 0, teamTimeZone: profile.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone };
      for (const [name, value] of Object.entries(defaults)) {
        if (!(name in cached) && !form.isFieldTouched(name)) form.setFieldValue(name, value);
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, [key]);
  return { restored: Boolean(snapshot) && !saved, saved,
    save: () => { if (key) { writeFormDraft(key, form.getFieldsValue(true)); setSaved(true); } },
    clear: () => { if (key) clearFormDraft(key); setSaved(false); },
  };
};
