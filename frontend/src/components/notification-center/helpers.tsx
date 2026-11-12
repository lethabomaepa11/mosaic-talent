import { Bell, BellOff } from "lucide-react";
import { readApiError } from "@/providers/notification-provider";

export const formatDate = (isoValue: string) => {
  const value = new Date(isoValue);
  if (!Number.isFinite(value.getTime())) return "Unknown date";
  return value.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

export const severityColor = (severity: string) => {
  switch (severity.trim().toLowerCase()) {
    case "success": return "green";
    case "warn":
    case "warning": return "gold";
    case "error": return "red";
    default: return "blue";
  }
};

export const detectStandalone = () => {
  if (typeof window === "undefined") return false;
  const mediaStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const navigatorStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return mediaStandalone || navigatorStandalone;
};

export const toErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return readApiError(error, fallback);
};

export const getNotificationUrl = (jsonData?: string) => {
  if (!jsonData || !jsonData.trim()) return "";
  const readUrlValue = (value: unknown) => typeof value === "string" ? value.trim() : "";
  try {
    const parsed = JSON.parse(jsonData) as Record<string, unknown>;
    const directUrl = readUrlValue(parsed.url) || readUrlValue(parsed.Url);
    if (directUrl) return directUrl;
    const nested = parsed.properties;
    if (nested && typeof nested === "object") {
      const nestedRecord = nested as Record<string, unknown>;
      return readUrlValue(nestedRecord.url) || readUrlValue(nestedRecord.Url);
    }
    return "";
  } catch { return ""; }
};

export const getPushButton = (state: { pushSupported: boolean; isPushConfigured: boolean; isPushSubscribed: boolean }) => {
  if (!state.pushSupported) return { label: "Push unsupported", disabled: true, icon: <BellOff size={14}/> };
  if (!state.isPushConfigured) return { label: "Push unavailable", disabled: true, icon: <BellOff size={14}/> };
  if (state.isPushSubscribed) return { label: "Disable push", disabled: false, icon: <BellOff size={14}/> };
  return { label: "Enable push", disabled: false, icon: <Bell size={14}/> };
};
