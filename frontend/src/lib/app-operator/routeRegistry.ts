"use client";

import { IRouteDefinition } from "./types";

export const APP_ROUTE_REGISTRY: Record<string, IRouteDefinition> = {
  dashboard: { key: "dashboard", path: "/app", label: "Dashboard", roles: ["all"] },
  profile: { key: "profile", path: "/app/profile", label: "Profile", roles: ["all"] },
  projectsMy: { key: "projectsMy", path: "/app/projects/my", label: "My Projects", roles: ["developer"] },
  projectsOpen: { key: "projectsOpen", path: "/app/projects/open", label: "Open Projects", roles: ["developer"] },
  simulator: { key: "simulator", path: "/app/simulator", label: "AI Simulator", roles: ["developer"] },
  reviews: { key: "reviews", path: "/app/reviews", label: "Peer Reviews", roles: ["developer"] },
  jobs: { key: "jobs", path: "/app/jobs", label: "Job Postings", roles: ["company"] },
  reports: { key: "reports", path: "/app/reports", label: "Reports", roles: ["company"] },
  settings: { key: "settings", path: "/app/settings", label: "Settings", roles: ["company"] },
  employeesSettings: {
    key: "employeesSettings",
    path: "/app/settings/employees",
    label: "Employee Settings",
    roles: ["company"],
  },
  settingsCompanyDetails: {
    key: "settingsCompanyDetails",
    path: "/app/settings/company-details",
    label: "Company Details Settings",
    roles: ["company"],
  },
  settingsEmailTemplates: {
    key: "settingsEmailTemplates",
    path: "/app/settings/email-templates",
    label: "Email Templates Settings",
    roles: ["company"],
  },
  settingsPageBuilder: {
    key: "settingsPageBuilder",
    path: "/app/settings/page-builder",
    label: "Page Builder Settings",
    roles: ["company"],
  },
};

const keywordToRouteKey: Array<{ keywords: string[]; key: keyof typeof APP_ROUTE_REGISTRY }> = [
  { keywords: ["dashboard", "home"], key: "dashboard" },
  { keywords: ["profile"], key: "profile" },
  { keywords: ["my projects", "projects"], key: "projectsMy" },
  { keywords: ["open projects", "discover"], key: "projectsOpen" },
  { keywords: ["simulator"], key: "simulator" },
  { keywords: ["reviews"], key: "reviews" },
  { keywords: ["job postings", "jobs", "hiring"], key: "jobs" },
  { keywords: ["reports", "analytics"], key: "reports" },
  { keywords: ["settings"], key: "settings" },
  { keywords: ["employees", "users"], key: "employeesSettings" },
  { keywords: ["company details"], key: "settingsCompanyDetails" },
  { keywords: ["email templates", "email settings"], key: "settingsEmailTemplates" },
  { keywords: ["page builder", "build pages"], key: "settingsPageBuilder" },
];

export const resolveRouteKeyFromText = (input: string) => {
  const normalized = input.toLowerCase();
  const matched = keywordToRouteKey.find((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword)),
  );
  return matched?.key;
};
