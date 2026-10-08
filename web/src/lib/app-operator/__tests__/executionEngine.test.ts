import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeOperatorIntent } from "../executionEngine";
import { IAppOperatorIntent } from "../types";

const buildIntent = (partial: Partial<IAppOperatorIntent>): IAppOperatorIntent => ({
  type: partial.type ?? "navigate",
  rawCommand: partial.rawCommand ?? "",
  params: partial.params ?? {},
  missingRequired: partial.missingRequired ?? [],
  requiresConfirmation: Boolean(partial.requiresConfirmation),
  routeKey: partial.routeKey,
});

describe("executeOperatorIntent", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("navigates for route commands", async () => {
    const navigate = vi.fn();
    const result = await executeOperatorIntent(
      buildIntent({ type: "navigate", routeKey: "jobs", rawCommand: "go to jobs" }),
      { currentPath: "/app", navigate },
    );

    expect(result.success).toBe(true);
    expect(navigate).toHaveBeenCalledWith("/app/jobs");
  });

  it("fills and submits create job flow", async () => {
    const open = document.createElement("button");
    open.setAttribute("data-ai-action", "open-create-job");
    const title = document.createElement("input");
    title.setAttribute("data-ai-field", "job-title");
    const location = document.createElement("input");
    location.setAttribute("data-ai-field", "job-location");
    const description = document.createElement("textarea");
    description.setAttribute("data-ai-field", "job-description");
    const submit = document.createElement("button");
    submit.setAttribute("data-ai-action", "submit-create-job");
    const submitSpy = vi.fn();
    submit.addEventListener("click", submitSpy);
    document.body.append(open, title, location, description, submit);

    const result = await executeOperatorIntent(
      buildIntent({
        type: "create_job",
        rawCommand: "create job",
        routeKey: "jobs",
        params: {
          title: "Frontend Engineer",
          location: "Remote",
          description: "Role summary",
        },
      }),
      { currentPath: "/app/jobs", navigate: vi.fn() },
    );

    expect(result.success).toBe(true);
    expect(title.value).toBe("Frontend Engineer");
    expect(submitSpy).toHaveBeenCalledTimes(1);
  });

  it("executes single-click actions", async () => {
    const saveButton = document.createElement("button");
    saveButton.setAttribute("data-ai-action", "save-profile");
    const saveSpy = vi.fn();
    saveButton.addEventListener("click", saveSpy);
    document.body.append(saveButton);

    const result = await executeOperatorIntent(
      buildIntent({
        type: "save_profile",
        rawCommand: "save profile",
      }),
      { currentPath: "/app/profile", navigate: vi.fn() },
    );

    expect(result.success).toBe(true);
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it("fills profile bio and saves", async () => {
    const bio = document.createElement("textarea");
    bio.setAttribute("data-ai-field", "profile-bio");
    const saveButton = document.createElement("button");
    saveButton.setAttribute("data-ai-action", "save-profile");
    const saveSpy = vi.fn();
    saveButton.addEventListener("click", saveSpy);
    document.body.append(bio, saveButton);

    const result = await executeOperatorIntent(
      buildIntent({
        type: "save_profile",
        rawCommand: "change my bio to hello",
        params: {
          bio: "Senior React engineer focused on DX",
        },
      }),
      { currentPath: "/app/profile", navigate: vi.fn() },
    );

    expect(result.success).toBe(true);
    expect(bio.value).toContain("Senior React engineer");
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });
});
