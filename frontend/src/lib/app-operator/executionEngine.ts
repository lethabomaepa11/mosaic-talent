"use client";

import { APP_ACTION_REGISTRY } from "./actionRegistry";
import { APP_ROUTE_REGISTRY } from "./routeRegistry";
import { formatMissingFieldsMessage } from "./safety";
import { IAppOperatorIntent, IExecutionResult } from "./types";

interface IExecutionContext {
  currentPath: string;
  navigate: (path: string) => void;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const queryOne = (selector?: string) => {
  if (!selector) {
    return null;
  }

  return document.querySelector<HTMLElement>(selector);
};

const clickElement = (selector?: string) => {
  const target = queryOne(selector);
  if (!target) {
    return false;
  }
  target.click();
  return true;
};

const setFieldValue = (selector: string | undefined, value: string) => {
  if (!selector) {
    return false;
  }

  const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (!input) {
    return false;
  }

  input.focus();
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
};

const withRoute = async (
  route: string | undefined,
  context: IExecutionContext,
  narration: string[],
) => {
  if (!route) {
    return;
  }

  const targetPath = APP_ROUTE_REGISTRY[route]?.path ?? route;
  if (!targetPath) {
    return;
  }

  if (context.currentPath !== targetPath) {
    context.navigate(targetPath);
    narration.push(`I navigated to ${targetPath}.`);
    await sleep(320);
  }
};

const executeRegisteredAction = async (
  actionKey: keyof typeof APP_ACTION_REGISTRY,
  intent: IAppOperatorIntent,
  context: IExecutionContext,
): Promise<IExecutionResult> => {
  const narration: string[] = [];
  const action = APP_ACTION_REGISTRY[actionKey];
  await withRoute(action.routeKey, context, narration);

  if (action.uiTargets.openButton) {
    const opened = clickElement(action.uiTargets.openButton);
    if (!opened) {
      return {
        success: false,
        narration,
        error: `I could not open the ${action.name} flow.`,
      };
    }
    narration.push(`I opened ${action.name}.`);
    await sleep(120);
  }

  const fields = action.uiTargets.fields ?? {};
  const fieldKeys = Object.keys(fields);
  if (fieldKeys.length > 0) {
    fieldKeys.forEach((key) => {
      if (intent.params[key]) {
        setFieldValue(fields[key], intent.params[key]);
      }
    });
    narration.push("I filled the known form fields.");
  }

  if (action.uiTargets.submitButton) {
    const submitted = clickElement(action.uiTargets.submitButton);
    if (!submitted) {
      return {
        success: false,
        narration,
        error: `I could not find the ${action.name} submit/execute control.`,
      };
    }
    narration.push(`I executed ${action.name}.`);
  }

  return { success: true, narration };
};

const executeOpenCandidateApplication = async (
  intent: IAppOperatorIntent,
): Promise<IExecutionResult> => {
  const narration: string[] = [];
  const cards = Array.from(
    document.querySelectorAll<HTMLElement>("[data-ai-entity='job-application']"),
  );
  const normalizedTarget = (intent.params.candidateName ?? "").toLowerCase();
  const matched = cards.find((card) =>
    (card.dataset.aiEntityName ?? "").toLowerCase().includes(normalizedTarget),
  );

  if (!matched) {
    return {
      success: false,
      narration,
      error: `I could not find "${intent.params.candidateName}" on the current applications page.`,
    };
  }

  const viewButton = matched.querySelector<HTMLElement>("[data-ai-action='view-application']");
  if (!viewButton) {
    return {
      success: false,
      narration,
      error: "I found the candidate card but not the View Application action.",
    };
  }

  viewButton.click();
  narration.push(`I opened ${intent.params.candidateName}'s application.`);
  return { success: true, narration };
};

const executeShortlistCandidates = async (
  intent: IAppOperatorIntent,
): Promise<IExecutionResult> => {
  const narration: string[] = [];
  const action = APP_ACTION_REGISTRY.shortlist_candidates;
  setFieldValue(action.uiTargets.fields?.search, intent.params.skill ?? "");
  narration.push(`I filtered candidates by "${intent.params.skill ?? ""}".`);

  const moved = clickElement(action.uiTargets.submitButton);
  if (!moved) {
    return {
      success: false,
      narration,
      error: "I could not trigger bulk shortlist to assessment.",
    };
  }

  narration.push("I triggered bulk move to assessment for matching candidates.");
  if (intent.params.teamwork) {
    narration.push(
      `Teamwork >= ${intent.params.teamwork} is not a dedicated UI filter, so current app thresholds were used.`,
    );
  }

  return { success: true, narration };
};

export const executeOperatorIntent = async (
  intent: IAppOperatorIntent,
  context: IExecutionContext,
): Promise<IExecutionResult> => {
  if (intent.missingRequired.length > 0) {
    return {
      success: false,
      narration: [formatMissingFieldsMessage(intent.missingRequired)],
      blockedByMissing: intent.missingRequired,
    };
  }

  if (intent.type === "navigate") {
    const route = intent.routeKey
      ? APP_ROUTE_REGISTRY[intent.routeKey]?.path
      : intent.params.route;
    if (!route) {
      return { success: false, narration: [], error: "I could not resolve the destination route." };
    }

    context.navigate(route);
    return { success: true, narration: [`I navigated to ${route}.`] };
  }

  if (intent.type === "open_candidate_application") {
    return executeOpenCandidateApplication(intent);
  }

  if (intent.type === "shortlist_candidates") {
    return executeShortlistCandidates(intent);
  }

  const actionByType: Partial<Record<IAppOperatorIntent["type"], keyof typeof APP_ACTION_REGISTRY>> = {
    create_user: "create_user",
    create_job: "create_job",
    create_project: "create_project",
    ai_match_project: "ai_match_project",
    join_open_project: "join_open_project",
    save_profile: "save_profile",
    scan_github_profile: "scan_github_profile",
    generate_peer_reviews: "generate_peer_reviews",
    save_company_details: "save_company_details",
    save_email_templates: "save_email_templates",
    publish_page_builder: "publish_page_builder",
    ask_ai_page_builder: "ask_ai_page_builder",
    start_scenario: "start_scenario",
    contribute_scenario: "contribute_scenario",
    end_simulation: "end_simulation",
    reject_candidate: "reject_candidate",
    send_candidate_email: "send_candidate_email",
  };

  const actionKey = actionByType[intent.type];
  if (actionKey) {
    return executeRegisteredAction(actionKey, intent, context);
  }

  return {
    success: false,
    narration: [],
    error: "I understood the request but do not have an execution strategy for this action yet.",
  };
};
