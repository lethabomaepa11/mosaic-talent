"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthAction, useAuthState } from "@/providers/auth-provider";
import { useDeveloperAction, type IDeveloperProfile } from "@/providers/developer-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { clearDraft, readDraft, storeDraft } from "./draftStorage";

export const useOnboarding = () => {
  const [draft, setDraft] = useState<IDeveloperProfile>();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [importing, setImporting] = useState(false);
  const [reload, setReload] = useState(0);
  const router = useRouter();
  const { isAuthenticated, isSessionRestored, user } = useAuthState();
  const { tenancyName } = useTenantResolutionState();
  const { beginGithubConnection } = useAuthAction();
  const { fetchMyProfile, upsertMyProfile, getGithubSkillSuggestions } = useDeveloperAction();

  useEffect(() => {
    if (!isSessionRestored) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (tenancyName) { router.replace("/app"); return; }
    let cancelled = false;
    setLoading(true);
    setError("");
    const load = async () => {
      const loaded = await fetchMyProfile();
      if (cancelled) return;
      if (!loaded || loaded.userId !== user?.userId) {
        setError("Unable to load your profile. Please try again.");
        setLoading(false);
        return;
      }
      if (loaded.hasCompletedOnboarding) { clearDraft(loaded.userId!); router.replace("/app/projects/my"); return; }
      const cached = readDraft(loaded.userId!);
      const profile = { ...loaded, skills: cached.skills ?? loaded.skills, goals: cached.goals ?? loaded.goals };
      const query = new URLSearchParams(window.location.search);
      const connected = query.get("githubConnected") === "1";
      if (query.get("githubConnected") === "0") setNotice("GitHub could not be connected. Try again or skip it and add skills manually.");
      query.delete("githubConnected");
      query.delete("githubConnectError");
      window.history.replaceState(null, "", `/onboarding${query.size ? `?${query}` : ""}`);
      setDraft(profile);
      setStep(connected ? 2 : Math.min(3, Math.max(0, profile.onboardingStep ?? 0)));
      setLoading(false);
      if (profile.githubUsername && (connected || (profile.onboardingStep ?? 0) < 2)) {
        setImporting(true);
        try {
          const suggestions = await getGithubSkillSuggestions();
          if (!cancelled) {
            setDraft((current) => current && ({ ...current, skills: Array.from(new Set([...current.skills, ...suggestions])) }));
            if (suggestions.length) setNotice("Skills from your GitHub repositories were added. Review them and remove any that do not fit.");
          }
        } catch {
          if (!cancelled) setNotice("GitHub skills are unavailable. You can add your skills manually.");
        } finally { if (!cancelled) setImporting(false); }
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [isAuthenticated, isSessionRestored, user?.userId, tenancyName, reload, router]);

  const save = async (nextStep: number, complete = false, skipGoals = false) => {
    if (!draft) return;
    if (!draft.fullName?.trim() || !draft.emailAddress?.trim()) { setError("Your account needs a full name and email before continuing."); return; }
    if ((step === 2 || complete) && !draft.skills.some((skill) => skill.trim())) { setError("Add at least one skill before continuing."); return; }
    setBusy(true);
    setError("");
    try {
      const saved = await upsertMyProfile({ ...draft, goals: skipGoals ? [] : draft.goals, onboardingStep: nextStep, completeOnboarding: complete });
      if (user) clearDraft(user.userId);
      setDraft(saved);
      if (complete) router.replace("/app/projects/my");
      else setStep(nextStep);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Your details could not be saved. Try again.");
    } finally { setBusy(false); }
  };

  const connectGithub = async () => {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      await upsertMyProfile({ ...draft, onboardingStep: 1, completeOnboarding: false });
      if (user) clearDraft(user.userId);
      const url = await beginGithubConnection("/onboarding");
      window.location.assign(url);
    } catch {
      setError("GitHub could not be connected. Try again or skip it and add your skills manually.");
      setBusy(false);
    }
  };

  const changeValues = (field: "skills" | "goals", values: string[]) => {
    if (!draft) return;
    const updated = { ...draft, [field]: values };
    setDraft(updated);
    if (user) storeDraft(user.userId, updated.skills, updated.goals);
  };

  return { draft, step, loading, busy, importing, error, notice, changeValues, connectGithub,
    next: () => save(step + 1), finish: (skipGoals = false) => save(3, true, skipGoals),
    back: () => { setError(""); setStep((current) => Math.max(0, current - 1)); },
    retry: () => setReload((current) => current + 1) };
};
