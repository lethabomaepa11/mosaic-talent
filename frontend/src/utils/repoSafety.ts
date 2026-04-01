import type { IRepoSafetyFinding, IRepoSafetyResult } from "@/providers/project-provider/context";

const MALICIOUS_KEYWORDS = [
  "malicious",
  "backdoor",
  "trojan",
  "ransomware",
  "credential",
  "stealer",
  "command and control",
  "payload",
];

const findingLooksMalicious = (finding: IRepoSafetyFinding) => {
  const severity = (finding.severity ?? "").trim().toLowerCase();
  if (severity === "high" || severity === "critical") {
    return true;
  }

  const text = `${finding.category ?? ""} ${finding.title ?? ""} ${finding.description ?? ""}`
    .toLowerCase();

  return MALICIOUS_KEYWORDS.some((keyword) => text.includes(keyword));
};

export const isRepoSafetyUnsafe = (result?: IRepoSafetyResult) => {
  if (!result) {
    return false;
  }

  const riskLevel = (result.riskLevel ?? "").trim().toLowerCase();
  if (riskLevel === "high" || riskLevel === "critical") {
    return true;
  }

  return (result.findings ?? []).some(findingLooksMalicious);
};
