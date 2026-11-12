import { isAxiosError } from "axios";

export const registrationErrorMessage = (error: unknown): string => {
  const fallback = "Unable to create your account. Check your details and try again.";
  if (isAxiosError(error)) {
    const details = error.response?.data?.error;
    const validationErrors = details?.validationErrors;
    if (Array.isArray(validationErrors)) {
      const messages = validationErrors
        .map((entry: { message?: unknown }) => typeof entry?.message === "string" ? entry.message.trim() : "")
        .filter(Boolean);
      if (messages.length) return [...new Set(messages)].join(" ");
    }
    return typeof details?.message === "string" && details.message.trim() ? details.message : fallback;
  }
  return error instanceof Error ? error.message : fallback;
};
