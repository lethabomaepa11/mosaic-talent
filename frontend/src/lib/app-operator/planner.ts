"use client";

import { AxiosInstance } from "axios";
import { APP_ACTION_REGISTRY } from "./actionRegistry";
import { parseOperatorCommand } from "./intentParser";
import { APP_ROUTE_REGISTRY } from "./routeRegistry";
import { AppOperatorIntentType, IAppOperatorIntent } from "./types";

const OPERATOR_PLANNER_ENDPOINT = "/api/services/app/AppOperator/Plan";

const SUPPORTED_INTENT_TYPES: AppOperatorIntentType[] = [
  "navigate",
  "create_user",
  "create_job",
  "create_project",
  "ai_match_project",
  "join_open_project",
  "save_profile",
  "scan_github_profile",
  "generate_peer_reviews",
  "save_company_details",
  "save_email_templates",
  "publish_page_builder",
  "ask_ai_page_builder",
  "start_scenario",
  "contribute_scenario",
  "end_simulation",
  "open_candidate_application",
  "shortlist_candidates",
  "reject_candidate",
  "send_candidate_email",
];

export type AppOperatorPlanningSource = "groq" | "fallback";

export interface IAppOperatorPlanningResult {
  intent: IAppOperatorIntent;
  source: AppOperatorPlanningSource;
}

interface IPlannerPayload {
  command: string;
  currentPath: string;
  routes: Array<{
    key: string;
    path: string;
    label: string;
  }>;
  actions: Array<{
    id: string;
    name: string;
    description: string;
    routeKey?: string;
    requiredInputs: string[];
    optionalInputs: string[];
    requiresConfirmation: boolean;
  }>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const readCaseInsensitive = (value: Record<string, unknown>, key: string): unknown => {
  const matchedKey = Object.keys(value).find(
    (existingKey) => existingKey.toLowerCase() === key.toLowerCase(),
  );
  return matchedKey ? value[matchedKey] : undefined;
};

const normalizeStringMap = (value: unknown) => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, string>>((acc, [key, raw]) => {
    if (!key.trim()) {
      return acc;
    }
    acc[key.trim()] = raw == null ? "" : String(raw).trim();
    return acc;
  }, {});
};

const normalizeStringArray = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
};

const toIntentType = (value: unknown): AppOperatorIntentType | null => {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }

  const matched = SUPPORTED_INTENT_TYPES.find(
    (intentType) => intentType.toLowerCase() === normalized.toLowerCase(),
  );

  return matched ?? null;
};

const toRouteKey = (value: unknown): string | undefined => {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return undefined;
  }

  const matched = Object.keys(APP_ROUTE_REGISTRY).find(
    (routeKey) => routeKey.toLowerCase() === normalized.toLowerCase(),
  );

  return matched;
};

const buildPayload = (command: string, currentPath: string): IPlannerPayload => ({
  command,
  currentPath,
  routes: Object.values(APP_ROUTE_REGISTRY).map((route) => ({
    key: route.key,
    path: route.path,
    label: route.label,
  })),
  actions: Object.values(APP_ACTION_REGISTRY).map((action) => ({
    id: action.id,
    name: action.name,
    description: action.description,
    routeKey: action.routeKey,
    requiredInputs: action.requiredInputs,
    optionalInputs: action.optionalInputs,
    requiresConfirmation: action.requiresConfirmation,
  })),
});

const normalizePlannedIntent = (
  candidate: unknown,
  fallback: IAppOperatorIntent,
): IAppOperatorIntent | null => {
  if (!isRecord(candidate)) {
    return null;
  }

  const type = toIntentType(readCaseInsensitive(candidate, "type"));
  if (!type) {
    return null;
  }

  const params = normalizeStringMap(readCaseInsensitive(candidate, "params"));

  if (type === "navigate") {
    const routeKey =
      toRouteKey(readCaseInsensitive(candidate, "routeKey")) ??
      fallback.routeKey ??
      "dashboard";
    return {
      type,
      rawCommand: fallback.rawCommand,
      routeKey,
      params: {
        route: APP_ROUTE_REGISTRY[routeKey]?.path ?? "/app",
      },
      missingRequired: [],
      requiresConfirmation: false,
    };
  }

  const actionDefinition = APP_ACTION_REGISTRY[type];
  if (!actionDefinition) {
    return null;
  }

  const routeKey =
    toRouteKey(readCaseInsensitive(candidate, "routeKey")) ?? actionDefinition.routeKey;
  const missingRequired = actionDefinition.requiredInputs.filter(
    (field) => !String(params[field] ?? "").trim(),
  );

  return {
    type,
    rawCommand: fallback.rawCommand,
    routeKey,
    params,
    missingRequired: missingRequired.length
      ? missingRequired
      : normalizeStringArray(readCaseInsensitive(candidate, "missingRequired")),
    requiresConfirmation: actionDefinition.requiresConfirmation,
  };
};

export const planOperatorIntent = async (
  instance: AxiosInstance,
  command: string,
  currentPath: string,
): Promise<IAppOperatorPlanningResult> => {
  const fallbackIntent = parseOperatorCommand(command);
  const payload = buildPayload(command, currentPath);

  try {
    const response = await instance.post(OPERATOR_PLANNER_ENDPOINT, payload);
    const plannedIntent = normalizePlannedIntent(response?.data?.result, fallbackIntent);
    if (!plannedIntent) {
      return { intent: fallbackIntent, source: "fallback" };
    }

    return { intent: plannedIntent, source: "groq" };
  } catch {
    return { intent: fallbackIntent, source: "fallback" };
  }
};
