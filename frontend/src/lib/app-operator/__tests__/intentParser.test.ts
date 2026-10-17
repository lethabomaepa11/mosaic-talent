import { describe, expect, it } from "vitest";
import { parseOperatorCommand } from "../intentParser";

describe("parseOperatorCommand", () => {
  it("parses create user and detects missing required fields", () => {
    const intent = parseOperatorCommand("Create a new user called Simon Manga");
    expect(intent.type).toBe("create_user");
    expect(intent.params.name).toBe("Simon");
    expect(intent.params.surname).toBe("Manga");
    expect(intent.missingRequired).toEqual(["email", "password"]);
  });

  it("parses create job command", () => {
    const intent = parseOperatorCommand(
      "Go to job postings and create a frontend engineer job with React and TypeScript.",
    );
    expect(intent.type).toBe("create_job");
    expect(intent.params.title).toContain("frontend engineer");
    expect(intent.params.description).toContain("React");
  });

  it("parses navigation fallback", () => {
    const intent = parseOperatorCommand("navigate to the HR dashboard");
    expect(intent.type).toBe("navigate");
    expect(intent.routeKey).toBe("dashboard");
  });

  it("does not route retired simulator commands to a simulator action", () => {
    const intent = parseOperatorCommand("navigate to the simulator");
    expect(intent.routeKey).not.toBe("simulator");
    expect(intent.params.route).not.toContain("simulator");

    const startIntent = parseOperatorCommand("start simulation");
    expect(startIntent.type).not.toBe("start_scenario");
  });

  it("parses quick action commands", () => {
    const intent = parseOperatorCommand("Save email templates");
    expect(intent.type).toBe("save_email_templates");
  });

  it("parses profile bio update command", () => {
    const intent = parseOperatorCommand("change my bio to Senior React engineer focused on DX");
    expect(intent.type).toBe("save_profile");
    expect(intent.routeKey).toBe("profile");
    expect(intent.params.bio).toContain("Senior React engineer");
  });
});
