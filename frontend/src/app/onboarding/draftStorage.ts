const key = (userId: number) => `mosaic-talent.onboarding-form.${userId}`;

export const readDraft = (userId: number): { skills?: string[]; goals?: string[] } => {
  try {
    const input = JSON.parse(sessionStorage.getItem(key(userId)) || "{}");
    const strings = (values: unknown): string[] | undefined => Array.isArray(values)
      ? values.filter((value): value is string => typeof value === "string") : undefined;
    return { skills: strings(input.skills), goals: strings(input.goals) };
  } catch { return {}; }
};

export const storeDraft = (userId: number, skills: string[], goals: string[]) => {
  try { sessionStorage.setItem(key(userId), JSON.stringify({ skills, goals })); } catch { /* Backend saves still work when browser storage is unavailable. */ }
};

export const clearDraft = (userId: number) => {
  try { sessionStorage.removeItem(key(userId)); } catch { /* Optional local form cache. */ }
};
