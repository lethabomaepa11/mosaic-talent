"use client";

import { IAppOperatorIntent } from "./types";

const riskyKeywords = ["delete", "remove", "reject", "send email", "publish", "permission", "role"];

export const commandLooksRisky = (command: string) => {
  const normalized = command.toLowerCase();
  return riskyKeywords.some((keyword) => normalized.includes(keyword));
};

export const intentNeedsConfirmation = (intent: IAppOperatorIntent) => {
  if (intent.requiresConfirmation) {
    return true;
  }

  return commandLooksRisky(intent.rawCommand);
};

export const formatMissingFieldsMessage = (fields: string[]) => {
  if (fields.length === 0) {
    return "";
  }

  if (fields.length === 1) {
    return `I need ${fields[0]} before I can submit.`;
  }

  return `I need these required fields before I can submit: ${fields.join(", ")}.`;
};
