export type EmailTemplateTypeKey =
  | "applicationReceived"
  | "shortlisted"
  | "interviewInvite";

export interface IEmailTemplateEntry {
  enabled: boolean;
  mode: "manual" | "ai";
  subject: string;
  body: string;
}

export type IEmailTemplateSettings = Record<EmailTemplateTypeKey, IEmailTemplateEntry>;

export interface IEmailTemplateTypeOption {
  key: EmailTemplateTypeKey;
  label: string;
  description: string;
}

const defaultEmailTemplateSettings: IEmailTemplateSettings = {
  applicationReceived: {
    enabled: true,
    mode: "manual",
    subject: "Application received for {jobTitle}",
    body: "Hi {candidateName},\n\nThanks for applying to {companyName} for {jobTitle}. We received your application and our team will review it soon.\n\nRegards,\n{companyName} Team",
  },
  shortlisted: {
    enabled: true,
    mode: "manual",
    subject: "You have been shortlisted for {jobTitle}",
    body: "Hi {candidateName},\n\nGreat news. You have been shortlisted for the {jobTitle} role at {companyName}. We will share next steps shortly.\n\nRegards,\n{companyName} Team",
  },
  interviewInvite: {
    enabled: true,
    mode: "manual",
    subject: "Interview invitation for {jobTitle}",
    body: "Hi {candidateName},\n\nWe would like to invite you to an interview for {jobTitle} at {companyName}.\n\nPlease reply with your availability so we can confirm the schedule.\n\nRegards,\n{companyName} Team",
  },
};

export const EMAIL_TEMPLATE_TYPE_OPTIONS: IEmailTemplateTypeOption[] = [
  {
    key: "applicationReceived",
    label: "Application Received",
    description: "Sent immediately after an application is submitted.",
  },
  {
    key: "shortlisted",
    label: "Shortlisted",
    description: "Sent when a candidate moves to the shortlisted stage.",
  },
  {
    key: "interviewInvite",
    label: "Interview Invite",
    description: "Sent when inviting a candidate to interview.",
  },
];

const parseTemplateEntry = (
  input: unknown,
  fallback: IEmailTemplateEntry,
): IEmailTemplateEntry => {
  if (!input || typeof input !== "object") {
    return fallback;
  }

  const data = input as Partial<IEmailTemplateEntry>;
  return {
    enabled: typeof data.enabled === "boolean" ? data.enabled : fallback.enabled,
    mode: data.mode === "ai" ? "ai" : "manual",
    subject: (data.subject ?? "").trim() || fallback.subject,
    body: (data.body ?? "").trim() || fallback.body,
  };
};

export const getDefaultEmailTemplateSettings = (): IEmailTemplateSettings => ({
  applicationReceived: { ...defaultEmailTemplateSettings.applicationReceived },
  shortlisted: { ...defaultEmailTemplateSettings.shortlisted },
  interviewInvite: { ...defaultEmailTemplateSettings.interviewInvite },
});

export const parseEmailTemplateSettings = (json?: string): IEmailTemplateSettings => {
  const fallback = getDefaultEmailTemplateSettings();
  if (!json) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(json) as Partial<IEmailTemplateSettings>;
    return {
      applicationReceived: parseTemplateEntry(
        parsed.applicationReceived,
        fallback.applicationReceived,
      ),
      shortlisted: parseTemplateEntry(parsed.shortlisted, fallback.shortlisted),
      interviewInvite: parseTemplateEntry(
        parsed.interviewInvite,
        fallback.interviewInvite,
      ),
    };
  } catch {
    return fallback;
  }
};
