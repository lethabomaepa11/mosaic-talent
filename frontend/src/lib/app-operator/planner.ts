"use client";

import { AxiosInstance } from "axios";
import { APP_ACTION_REGISTRY } from "./actionRegistry";
import { parseOperatorCommand } from "./intentParser";
import { APP_ROUTE_REGISTRY } from "./routeRegistry";
import {
  AppOperatorIntentType,
  AppOperatorUserRole,
  IAppOperatorIntent,
} from "./types";

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

const SUPPORTED_MODES = ["execute", "chat", "guided"] as const;

const hasRoleAccess = (
  roles: Array<AppOperatorUserRole | "all">,
  role: AppOperatorUserRole,
) => roles.includes("all") || roles.includes(role);

const isRouteAllowedForRole = (
  routeKey: string | undefined,
  role: AppOperatorUserRole,
) => {
  if (!routeKey) {
    return true;
  }

  const route = APP_ROUTE_REGISTRY[routeKey];
  if (!route) {
    return false;
  }

  return hasRoleAccess(route.roles, role);
};

const isRoutePathAllowedForRole = (path: string | undefined, role: AppOperatorUserRole) => {
  if (!path) {
    return true;
  }

  const route = Object.values(APP_ROUTE_REGISTRY).find((entry) => entry.path === path);
  if (!route) {
    return true;
  }

  return hasRoleAccess(route.roles, role);
};

const isActionAllowedForRole = (
  actionKey: string | undefined,
  role: AppOperatorUserRole,
) => {
  if (!actionKey) {
    return false;
  }

  const action = APP_ACTION_REGISTRY[actionKey];
  if (!action) {
    return false;
  }

  return hasRoleAccess(action.roles, role) && isRouteAllowedForRole(action.routeKey, role);
};

const isIntentAllowedForRole = (intent: IAppOperatorIntent, role: AppOperatorUserRole) => {
  if (intent.type === "navigate") {
    return (
      isRouteAllowedForRole(intent.routeKey, role) &&
      isRoutePathAllowedForRole(intent.params.route, role)
    );
  }

  return isActionAllowedForRole(intent.type, role);
};

const roleSpecificCapabilityHint = (role: AppOperatorUserRole) => {
  if (role === "company") {
    return "I can help with jobs, reports, candidate workflows, and company settings.";
  }

  return "I can help with projects, peer reviews, simulator actions, and profile updates.";
};

const buildRoleRestrictedReply = (
  blockedIntent: IAppOperatorIntent,
  role: AppOperatorUserRole,
) => {
  if (blockedIntent.type === "navigate") {
    return `That page is not available for your account type. ${roleSpecificCapabilityHint(role)}`;
  }

  return `That action is not available for your account type. ${roleSpecificCapabilityHint(role)}`;
};

export type AppOperatorPlanningSource = "groq" | "fallback";
export type AppOperatorPlanMode = (typeof SUPPORTED_MODES)[number];
export type AppOperatorStepStatus = "pending" | "in_progress" | "done" | "blocked";

export interface IAppOperatorPlanStep {
  id: string;
  title: string;
  status: AppOperatorStepStatus;
}

export interface IAppOperatorPlanningResult {
  intent: IAppOperatorIntent;
  source: AppOperatorPlanningSource;
  mode: AppOperatorPlanMode;
  assistantReply: string;
  shouldOfferExecution: boolean;
  steps: IAppOperatorPlanStep[];
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

const toMode = (value: unknown): AppOperatorPlanMode | null => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const matched = SUPPORTED_MODES.find((mode) => mode === normalized);
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

const normalizeSteps = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as IAppOperatorPlanStep[];
  }

  const mapped = value
    .map((entry, index) => {
      if (typeof entry === "string") {
        const title = entry.trim();
        if (!title) {
          return null;
        }
        return {
          id: `step-${index + 1}`,
          title,
          status: "pending" as AppOperatorStepStatus,
        };
      }

      if (!isRecord(entry)) {
        return null;
      }

      const title = String(
        readCaseInsensitive(entry, "title") ??
          readCaseInsensitive(entry, "text") ??
          readCaseInsensitive(entry, "label") ??
          "",
      ).trim();

      if (!title) {
        return null;
      }

      const id = String(readCaseInsensitive(entry, "id") ?? `step-${index + 1}`).trim();
      return {
        id: id || `step-${index + 1}`,
        title,
        status: "pending" as AppOperatorStepStatus,
      };
    })
    .filter((step): step is IAppOperatorPlanStep => Boolean(step));

  return mapped.slice(0, 8);
};

const buildPayload = (
  command: string,
  currentPath: string,
  role: AppOperatorUserRole,
): IPlannerPayload => ({
  command,
  currentPath,
  routes: Object.values(APP_ROUTE_REGISTRY)
    .filter((route) => hasRoleAccess(route.roles, role))
    .map((route) => ({
      key: route.key,
      path: route.path,
      label: route.label,
    })),
  actions: Object.values(APP_ACTION_REGISTRY)
    .filter(
      (action) =>
        hasRoleAccess(action.roles, role) &&
        isRouteAllowedForRole(action.routeKey, role),
    )
    .map((action) => ({
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
  candidate: Record<string, unknown>,
  fallback: IAppOperatorIntent,
): IAppOperatorIntent | null => {
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

const looksLikeHowTo = (command: string) =>
  /(how|where|what|explain|help|guide|walk me through|step by step|can i|could i)/i.test(
    command,
  );

const looksLikeGuided = (command: string) =>
  /(walk me through|step by step|guide me|show me steps)/i.test(command);

const buildDefaultStepsFromIntent = (intent: IAppOperatorIntent): IAppOperatorPlanStep[] => {
  if (intent.type === "navigate") {
    const route = intent.routeKey ? APP_ROUTE_REGISTRY[intent.routeKey] : undefined;
    const title = route ? `Open ${route.label}` : "Open the requested page";
    return [{ id: "step-1", title, status: "pending" }];
  }

  const action = APP_ACTION_REGISTRY[intent.type];
  if (!action) {
    return [];
  }

  const routeStep =
    action.routeKey && APP_ROUTE_REGISTRY[action.routeKey]
      ? {
          id: "step-1",
          title: `Open ${APP_ROUTE_REGISTRY[action.routeKey].label}`,
          status: "pending" as AppOperatorStepStatus,
        }
      : null;

  const steps: IAppOperatorPlanStep[] = [];
  if (routeStep) {
    steps.push(routeStep);
  }

  if (action.uiTargets.openButton) {
    steps.push({
      id: `step-${steps.length + 1}`,
      title: `Open ${action.name}`,
      status: "pending",
    });
  }

  if (action.uiTargets.fields && Object.keys(action.uiTargets.fields).length > 0) {
    steps.push({
      id: `step-${steps.length + 1}`,
      title: "Fill required details",
      status: "pending",
    });
  }

  if (action.uiTargets.submitButton) {
    steps.push({
      id: `step-${steps.length + 1}`,
      title: "Submit and verify result",
      status: "pending",
    });
  }

  if (steps.length === 0) {
    steps.push({
      id: "step-1",
      title: `Run ${action.name}`,
      status: "pending",
    });
  }

  return steps;
};

const buildFallbackReply = (command: string, intent: IAppOperatorIntent) => {
  const action = APP_ACTION_REGISTRY[intent.type];
  if (intent.type === "navigate") {
    const route = intent.routeKey ? APP_ROUTE_REGISTRY[intent.routeKey] : undefined;
    return route
      ? `You can open ${route.label} from the sidebar, or I can take you there now.`
      : "I can guide you through this, or execute it for you now.";
  }

  if (action) {
    return `Here is how to do "${action.name}": follow the steps below. I can also run it for you now.`;
  }

  if (looksLikeHowTo(command)) {
    return "Here is a quick way to do that. If you want, I can take over and run it for you.";
  }

  return "I can help with this and execute it for you when you're ready.";
};

const buildRoleRestrictedPlanning = (
  blockedIntent: IAppOperatorIntent,
  role: AppOperatorUserRole,
): IAppOperatorPlanningResult =>
  toPlanningResult(
    "fallback",
    "chat",
    {
      type: "navigate",
      rawCommand: blockedIntent.rawCommand,
      routeKey: "dashboard",
      params: { route: APP_ROUTE_REGISTRY.dashboard.path },
      missingRequired: [],
      requiresConfirmation: false,
    },
    buildRoleRestrictedReply(blockedIntent, role),
    false,
    [],
  );

const toPlanningResult = (
  source: AppOperatorPlanningSource,
  mode: AppOperatorPlanMode,
  intent: IAppOperatorIntent,
  assistantReply: string,
  shouldOfferExecution: boolean,
  steps: IAppOperatorPlanStep[],
): IAppOperatorPlanningResult => ({
  source,
  mode,
  intent,
  assistantReply,
  shouldOfferExecution,
  steps,
});

const buildFallbackPlanning = (
  command: string,
  fallbackIntent: IAppOperatorIntent,
  role: AppOperatorUserRole,
): IAppOperatorPlanningResult => {
  if (!isIntentAllowedForRole(fallbackIntent, role)) {
    return buildRoleRestrictedPlanning(fallbackIntent, role);
  }

  const howTo = looksLikeHowTo(command);
  const mode: AppOperatorPlanMode = howTo
    ? looksLikeGuided(command)
      ? "guided"
      : "chat"
    : "execute";

  const steps = buildDefaultStepsFromIntent(fallbackIntent);
  return toPlanningResult(
    "fallback",
    mode,
    fallbackIntent,
    buildFallbackReply(command, fallbackIntent),
    howTo,
    howTo ? steps : [],
  );
};

export const planOperatorIntent = async (
  instance: AxiosInstance,
  command: string,
  currentPath: string,
  role: AppOperatorUserRole = "developer",
): Promise<IAppOperatorPlanningResult> => {
  const fallbackIntent = parseOperatorCommand(command);
  if (!isIntentAllowedForRole(fallbackIntent, role)) {
    return buildRoleRestrictedPlanning(fallbackIntent, role);
  }

  const payload = buildPayload(command, currentPath, role);

  try {
    const response = await instance.post(OPERATOR_PLANNER_ENDPOINT, payload);
    const candidate = response?.data?.result;
    if (!isRecord(candidate)) {
      return buildFallbackPlanning(command, fallbackIntent, role);
    }

    const mode = toMode(readCaseInsensitive(candidate, "mode")) ?? "execute";
    const plannedIntent = normalizePlannedIntent(candidate, fallbackIntent) ?? fallbackIntent;
    const assistantReply = String(readCaseInsensitive(candidate, "assistantReply") ?? "").trim();
    const shouldOfferExecution = Boolean(readCaseInsensitive(candidate, "shouldOfferExecution"));
    const stepsFromModel = normalizeSteps(readCaseInsensitive(candidate, "steps"));
    const steps =
      stepsFromModel.length > 0
        ? stepsFromModel
        : mode !== "execute"
          ? buildDefaultStepsFromIntent(plannedIntent)
          : [];

    if (!isIntentAllowedForRole(plannedIntent, role)) {
      return buildRoleRestrictedPlanning(plannedIntent, role);
    }

    return toPlanningResult(
      "groq",
      mode,
      plannedIntent,
      assistantReply || buildFallbackReply(command, plannedIntent),
      shouldOfferExecution,
      steps,
    );
  } catch {
    return buildFallbackPlanning(command, fallbackIntent, role);
  }
};
