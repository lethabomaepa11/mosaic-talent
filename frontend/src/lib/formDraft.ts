const prefix = "mosaic.talent.form.";
export const draftEvent = "mosaic.talent.form-change";
export const getDraftSnapshot = (key: string) => {
  try { return key ? sessionStorage.getItem(prefix + key) || "" : ""; } catch { return ""; }
};
export const readFormDraft = <T extends object>(key: string): Partial<T> => {
  try {
    const value: unknown = JSON.parse(getDraftSnapshot(key) || "null");
    return value && typeof value === "object" && !Array.isArray(value) ? value as Partial<T> : {};
  } catch { return {}; }
};
export const writeFormDraft = (key: string, values: object) => {
  try { sessionStorage.setItem(prefix + key, JSON.stringify(values)); window.dispatchEvent(new Event(draftEvent)); } catch { /* Submission remains available. */ }
};
export const clearFormDraft = (key: string) => {
  try { sessionStorage.removeItem(prefix + key); window.dispatchEvent(new Event(draftEvent)); } catch { /* Optional form recovery. */ }
};
