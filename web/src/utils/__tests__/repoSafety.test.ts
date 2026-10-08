import { describe, expect, it } from "vitest";
import { isRepoSafetyUnsafe } from "../repoSafety";

describe("isRepoSafetyUnsafe", () => {
  it("returns false for low risk repository without malicious findings", () => {
    expect(
      isRepoSafetyUnsafe({
        repoUrl: "https://github.com/octocat/alpha",
        riskScore: 12,
        riskLevel: "low",
        categories: [],
        findings: [],
        badges: [],
      }),
    ).toBe(false);
  });

  it("returns true for high risk level", () => {
    expect(
      isRepoSafetyUnsafe({
        repoUrl: "https://github.com/octocat/alpha",
        riskScore: 78,
        riskLevel: "high",
        categories: [],
        findings: [],
        badges: [],
      }),
    ).toBe(true);
  });

  it("returns true when finding severity is high", () => {
    expect(
      isRepoSafetyUnsafe({
        repoUrl: "https://github.com/octocat/alpha",
        riskScore: 32,
        riskLevel: "medium",
        categories: [],
        findings: [
          {
            ruleId: "R1",
            category: "security",
            severity: "high",
            title: "Suspicious binary",
            description: "Potential malware payload.",
            filePath: "bin/payload.exe",
          },
        ],
        badges: [],
      }),
    ).toBe(true);
  });
});
