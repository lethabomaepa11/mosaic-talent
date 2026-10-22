import { expect, test } from "@playwright/test";

const ok = (result: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ result }) });
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

test("shares, reacts to, comments on, and converts an idea responsively", async ({ page }) => {
  await page.context().addCookies([
    { name: "mosaic-talent.access-token", value: "ideator-e2e", url: baseURL },
    { name: "mosaic-talent.abp-tenant-id", value: "1", url: baseURL },
    { name: "mosaic-talent.e2e", value: "1", url: baseURL },
  ]);
  let idea: Record<string, unknown> | undefined;
  await page.route("**/api/services/app/Session/GetCurrentLoginInformations", (route) => route.fulfill(ok({ user: { id: 41, userName: "jane", name: "Jane", surname: "Developer" } })));
  await page.route("**/api/services/app/DeveloperOnboarding/GetMyProfile", (route) => route.fulfill(ok({ userId: 41, githubUsername: "jane", studyLevel: 1, skills: [], goals: [], hasCompletedOnboarding: true })));
  await page.route("**/api/services/app/DeveloperProject/GetMyProjects", (route) => route.fulfill(ok([])));
  await page.route("**/api/services/app/DeveloperProject/GetOpenProjects", (route) => route.fulfill(ok([])));
  await page.route("**/api/services/app/Ideator/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/GetFeed")) return route.fulfill(ok(idea ? [idea] : []));
    if (path.endsWith("/CreateIdea")) {
      const input = route.request().postDataJSON();
      idea = { id: "idea-1", creatorDeveloperId: "dev-1", creatorName: "Jane Developer", ...input, createdAt: "2026-10-21T00:00:00Z", interestedCount: 0, likeCount: 0, dislikeCount: 0, commentCount: 0, isOwner: true, isConverted: false, comments: [] };
      return route.fulfill(ok(idea));
    }
    if (path.endsWith("/React")) { idea = { ...idea!, myReaction: route.request().postDataJSON().type, interestedCount: 1 }; return route.fulfill(ok(idea)); }
    if (path.endsWith("/Comment")) { idea = { ...idea!, commentCount: 1, comments: [{ id: "comment-1", authorName: "Jane Developer", body: "Good idea", createdAt: "2026-10-21T00:00:00Z" }] }; return route.fulfill(ok(idea)); }
    if (path.endsWith("/ConvertToProject")) { idea = { ...idea!, isConverted: true, convertedProjectId: "project-1" }; return route.fulfill(ok(idea)); }
    return route.fulfill(ok({}));
  });

  await page.goto("/app/ideator");
  await expect(page.getByRole("heading", { name: "Ideator" })).toBeVisible();
  await page.getByRole("textbox", { name: "Idea title" }).fill("Safer school routes");
  await page.getByRole("textbox", { name: "Problem statement" }).fill("Families cannot find safe routes.");
  await page.getByRole("textbox", { name: "Proposed solution" }).fill("Map community-verified paths.");
  await page.getByRole("checkbox", { name: "Share this idea publicly" }).uncheck();
  await page.getByRole("button", { name: "Share idea" }).click();
  await expect(page.getByRole("heading", { name: "Safer school routes" })).toBeVisible();
  await expect(page.getByText("Only you can see this idea")).toBeVisible();
  await page.getByRole("button", { name: /Interested/ }).click();
  await expect(page.getByRole("button", { name: /Interested · 1/ })).toBeVisible();
  await page.getByRole("textbox", { name: "Comment on Safer school routes" }).fill("Good idea");
  await page.getByRole("button", { name: "Comment" }).click();
  await expect(page.getByText("Good idea")).toBeVisible();
  await page.getByRole("button", { name: "Start a project" }).click();
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(page.getByText("Project started")).toBeVisible();

  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
