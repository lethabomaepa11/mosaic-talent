"use client";

export type AppOperatorIntentType =
  | "navigate"
  | "create_user"
  | "create_job"
  | "create_project"
  | "ai_match_project"
  | "join_open_project"
  | "save_profile"
  | "scan_github_profile"
  | "generate_peer_reviews"
  | "save_company_details"
  | "save_email_templates"
  | "publish_page_builder"
  | "ask_ai_page_builder"
  | "open_candidate_application"
  | "shortlist_candidates"
  | "reject_candidate"
  | "send_candidate_email";

export type AppOperatorUserRole = "developer" | "company";

export interface IAppOperatorIntent {
  type: AppOperatorIntentType;
  rawCommand: string;
  routeKey?: string;
  params: Record<string, string>;
  missingRequired: string[];
  requiresConfirmation: boolean;
}

export interface IRouteDefinition {
  key: string;
  path: string;
  label: string;
  roles: Array<"company" | "developer" | "all">;
}

export interface IActionSelectorMap {
  openButton?: string;
  submitButton?: string;
  fields?: Record<string, string>;
}

export interface IActionDefinition {
  id: string;
  name: string;
  description: string;
  routeKey?: string;
  roles: Array<AppOperatorUserRole | "all">;
  requiredInputs: string[];
  optionalInputs: string[];
  requiresConfirmation: boolean;
  uiTargets: IActionSelectorMap;
}

export interface IExecutionLogItem {
  id: string;
  role: "assistant" | "user";
  text: string;
}

export interface IExecutionResult {
  success: boolean;
  narration: string[];
  blockedByMissing?: string[];
  error?: string;
}
