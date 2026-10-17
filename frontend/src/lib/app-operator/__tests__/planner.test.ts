import { AxiosInstance } from "axios";
import { describe, expect, it, vi } from "vitest";
import { planOperatorIntent } from "../planner";

const makeInstance = (post: AxiosInstance["post"]) =>
  ({ post } as unknown as AxiosInstance);

describe("planOperatorIntent", () => {
  it("excludes retired simulator routes and actions from planner capabilities", async () => {
    const post = vi.fn().mockRejectedValue(new Error("network"));
    await planOperatorIntent(makeInstance(post), "show projects", "/app", "developer");
    const payload = post.mock.calls[0][1];
    expect(payload.routes).not.toContainEqual(expect.objectContaining({ path: "/app/simulator" }));
    expect(payload.actions).not.toContainEqual(expect.objectContaining({ id: "start_scenario" }));
  });
  it("returns Groq plan when backend returns a valid action", async () => {
    const post = vi.fn().mockResolvedValue({
      data: {
        result: {
          mode: "execute",
          type: "save_profile",
          params: {
            bio: "Senior React engineer focused on DX",
          },
        },
      },
    });

    const result = await planOperatorIntent(
      makeInstance(post),
      "change my bio to Senior React engineer focused on DX",
      "/app/profile",
    );

    expect(result.source).toBe("groq");
    expect(result.mode).toBe("execute");
    expect(result.intent.type).toBe("save_profile");
    expect(result.intent.routeKey).toBe("profile");
    expect(result.intent.params.bio).toContain("Senior React engineer");
  });

  it("falls back to rule-based parser when planner fails", async () => {
    const post = vi.fn().mockRejectedValue(new Error("network"));

    const result = await planOperatorIntent(
      makeInstance(post),
      "Create a new user called Simon Manga",
      "/app/settings/employees",
      "company",
    );

    expect(result.source).toBe("fallback");
    expect(result.mode).toBe("execute");
    expect(result.intent.type).toBe("create_user");
    expect(result.intent.missingRequired).toEqual(["email", "password"]);
  });

  it("computes missing required fields for Groq action plans", async () => {
    const post = vi.fn().mockResolvedValue({
      data: {
        result: {
          mode: "execute",
          type: "create_user",
          params: {
            name: "Simon",
            surname: "Manga",
            userName: "simon.manga",
          },
        },
      },
    });

    const result = await planOperatorIntent(
      makeInstance(post),
      "create user Simon Manga",
      "/app/settings/employees",
      "company",
    );

    expect(result.source).toBe("groq");
    expect(result.intent.type).toBe("create_user");
    expect(result.intent.missingRequired).toEqual(["email", "password"]);
    expect(result.intent.routeKey).toBe("employeesSettings");
  });

  it("returns chat/guided fallback for how-to commands", async () => {
    const post = vi.fn().mockRejectedValue(new Error("network"));

    const result = await planOperatorIntent(
      makeInstance(post),
      "How do I create a project with React?",
      "/app/projects/my",
      "developer",
    );

    expect(result.source).toBe("fallback");
    expect(result.mode).toBe("chat");
    expect(result.shouldOfferExecution).toBe(true);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it("blocks role-restricted fallback actions", async () => {
    const post = vi.fn().mockRejectedValue(new Error("network"));

    const result = await planOperatorIntent(
      makeInstance(post),
      "How do I create a frontend engineer job?",
      "/app/projects/my",
      "developer",
    );

    expect(result.mode).toBe("chat");
    expect(result.shouldOfferExecution).toBe(false);
    expect(result.steps).toEqual([]);
    expect(result.assistantReply).toContain("not available for your account type");
  });

  it("blocks role-restricted plans returned by Groq", async () => {
    const post = vi.fn().mockResolvedValue({
      data: {
        result: {
          mode: "guided",
          type: "create_job",
          assistantReply: "Use Jobs page and create a role.",
          shouldOfferExecution: true,
          steps: ["Open Jobs"],
          params: {
            title: "Frontend Engineer",
            location: "Remote",
            description: "Role summary",
          },
        },
      },
    });

    const result = await planOperatorIntent(
      makeInstance(post),
      "How do I create a frontend engineer job?",
      "/app/projects/my",
      "developer",
    );

    expect(result.mode).toBe("chat");
    expect(result.shouldOfferExecution).toBe(false);
    expect(result.steps).toEqual([]);
    expect(result.assistantReply).toContain("not available for your account type");
  });
});
