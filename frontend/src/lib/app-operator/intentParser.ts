"use client";

import { APP_ACTION_REGISTRY } from "./actionRegistry";
import { APP_ROUTE_REGISTRY, resolveRouteKeyFromText } from "./routeRegistry";
import { IAppOperatorIntent, AppOperatorIntentType } from "./types";

const normalizeNameParts = (fullName: string) => {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const name = parts[0] ?? "";
  const surname = parts.slice(1).join(" ") || "User";
  const userName = `${name}.${surname}`.replace(/\s+/g, ".").toLowerCase();

  return { name, surname, userName };
};

const readAfterKeyword = (command: string, keyword: string) => {
  const index = command.toLowerCase().indexOf(keyword);
  if (index < 0) {
    return "";
  }

  return command.slice(index + keyword.length).trim();
};

const buildIntent = (partial: Partial<IAppOperatorIntent>): IAppOperatorIntent => ({
  type: partial.type ?? "navigate",
  rawCommand: partial.rawCommand ?? "",
  routeKey: partial.routeKey,
  params: partial.params ?? {},
  missingRequired: partial.missingRequired ?? [],
  requiresConfirmation: Boolean(partial.requiresConfirmation),
});

const buildActionIntent = (
  type: AppOperatorIntentType,
  rawCommand: string,
  actionKey: string,
  params: Record<string, string>,
) => {
  const definition = APP_ACTION_REGISTRY[actionKey];
  const missingRequired = definition.requiredInputs.filter((field) => !params[field]);
  return buildIntent({
    type,
    rawCommand,
    routeKey: definition.routeKey,
    params,
    missingRequired,
    requiresConfirmation: definition.requiresConfirmation,
  });
};

const parseCreateUserIntent = (command: string): IAppOperatorIntent | null => {
  const match = command.match(/create(?:\s+a)?(?:\s+new)?\s+user\s+called\s+(.+)$/i);
  if (!match) {
    return null;
  }

  const rawName = match[1]?.trim() ?? "";
  const emailMatch = command.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  const passwordMatch = command.match(/password\s+([^\s]+)/i);
  const { name, surname, userName } = normalizeNameParts(rawName);

  return buildActionIntent("create_user", command, "create_user", {
    name,
    surname,
    userName,
    email: emailMatch?.[0] ?? "",
    password: passwordMatch?.[1] ?? "",
  });
};

const parseCreateJobIntent = (command: string): IAppOperatorIntent | null => {
  if (
    !/create(?:\s+a)?(?:\s+new)?\s+.+(job|role|posting)|create(?:\s+a)?(?:\s+new)?\s+(job|role|posting)/i.test(
      command,
    )
  ) {
    return null;
  }

  const titleMatch = command.match(
    /create(?:\s+a)?(?:\s+new)?\s+(?:a\s+)?(.+?)\s+(?:job|role|posting)/i,
  );
  const requirements = readAfterKeyword(command, "with");

  return buildActionIntent("create_job", command, "create_job", {
    title: titleMatch?.[1]?.trim() || "New Role",
    location: "Remote",
    description: requirements
      ? `Requirements: ${requirements}`
      : "Role summary and responsibilities.",
    requirements,
  });
};

const parseCreateProjectIntent = (command: string): IAppOperatorIntent | null => {
  if (
    !/create(?:\s+a)?(?:\s+new)?\s+project|new\s+project/i.test(command)
  ) {
    return null;
  }

  const titleMatch = command.match(/create(?:\s+a)?(?:\s+new)?\s+project(?:\s+called)?\s+(.+?)(?:\s+with|$)/i);
  const skills = readAfterKeyword(command, "with")
    .replace(/skills?/i, "")
    .trim();

  return buildActionIntent("create_project", command, "create_project", {
    title: titleMatch?.[1]?.trim() || "New Project",
    description: "Project created via AI operator.",
    skills,
  });
};

const parseOpenCandidateIntent = (command: string): IAppOperatorIntent | null => {
  const match = command.match(/open\s+(.+?)'?s?\s+application/i);
  if (!match) {
    return null;
  }

  return buildActionIntent(
    "open_candidate_application",
    command,
    "open_candidate_application",
    {
      candidateName: match[1]?.trim() ?? "",
    },
  );
};

const parseShortlistIntent = (command: string): IAppOperatorIntent | null => {
  if (!/shortlist/i.test(command)) {
    return null;
  }

  const skillPart = readAfterKeyword(command, "with");
  const teamworkMatch = command.match(/teamwork\s*(?:above|over|>=?)\s*(\d+)/i);
  const skill = skillPart
    .replace(/and\s+teamwork.+$/i, "")
    .replace(/[.]+$/, "")
    .trim();

  return buildActionIntent("shortlist_candidates", command, "shortlist_candidates", {
    skill,
    teamwork: teamworkMatch?.[1] ?? "",
  });
};

const parseProfileUpdateIntent = (command: string): IAppOperatorIntent | null => {
  const bioMatch = command.match(
    /(?:change|update|set)\s+(?:my\s+)?bio\s+(?:to|as)\s+(.+)$/i,
  );
  if (bioMatch) {
    return buildActionIntent("save_profile", command, "save_profile", {
      bio: bioMatch[1]?.trim() ?? "",
    });
  }

  const locationMatch = command.match(
    /(?:change|update|set)\s+(?:my\s+)?location\s+(?:to|as)\s+(.+)$/i,
  );
  if (locationMatch) {
    return buildActionIntent("save_profile", command, "save_profile", {
      location: locationMatch[1]?.trim() ?? "",
    });
  }

  return null;
};

const parseQuickActionIntent = (command: string): IAppOperatorIntent | null => {
  const normalized = command.toLowerCase();

  if (/ai match|match me/.test(normalized)) {
    return buildActionIntent("ai_match_project", command, "ai_match_project", {});
  }
  if (/join\s+(an?\s+)?open\s+project|join\s+project/i.test(command)) {
    return buildActionIntent("join_open_project", command, "join_open_project", {});
  }
  if (/save\s+profile|update\s+profile/i.test(normalized)) {
    return buildActionIntent("save_profile", command, "save_profile", {});
  }
  if (/scan\s+github|github\s+scan/i.test(normalized)) {
    return buildActionIntent("scan_github_profile", command, "scan_github_profile", {});
  }
  if (/generate\s+.*peer\s+review|generate\s+reviews/i.test(normalized)) {
    return buildActionIntent("generate_peer_reviews", command, "generate_peer_reviews", {});
  }
  if (/save\s+company\s+details|update\s+company\s+details/i.test(normalized)) {
    return buildActionIntent("save_company_details", command, "save_company_details", {});
  }
  if (/save\s+email\s+templates|update\s+email\s+templates/i.test(normalized)) {
    return buildActionIntent("save_email_templates", command, "save_email_templates", {});
  }
  if (/publish\s+page\s+builder|publish\s+jobs\s+page/i.test(normalized)) {
    return buildActionIntent("publish_page_builder", command, "publish_page_builder", {});
  }
  if (/ask\s+ai\s+builder|ai\s+builder/i.test(normalized)) {
    const prompt = readAfterKeyword(command, "builder");
    return buildActionIntent("ask_ai_page_builder", command, "ask_ai_page_builder", {
      prompt: prompt || command,
    });
  }
  return null;
};

const parseNavigateIntent = (command: string): IAppOperatorIntent => {
  const routeKey = resolveRouteKeyFromText(command) ?? "dashboard";
  return buildIntent({
    type: "navigate",
    rawCommand: command,
    routeKey,
    params: {
      route: APP_ROUTE_REGISTRY[routeKey]?.path ?? "/app",
    },
  });
};

export const parseOperatorCommand = (command: string): IAppOperatorIntent => {
  const trimmed = command.trim();
  if (!trimmed) {
    return parseNavigateIntent("dashboard");
  }

  return (
    parseCreateUserIntent(trimmed) ??
    parseCreateJobIntent(trimmed) ??
    parseCreateProjectIntent(trimmed) ??
    parseOpenCandidateIntent(trimmed) ??
    parseShortlistIntent(trimmed) ??
    parseProfileUpdateIntent(trimmed) ??
    parseQuickActionIntent(trimmed) ??
    parseNavigateIntent(trimmed)
  );
};
