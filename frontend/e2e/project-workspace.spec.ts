import { expect, test } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const ok = (result: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ result }) });

test("project members can share wiki notes and resource links across mobile and desktop", async ({ page }) => {
  await page.context().addCookies([
    { name: "mosaic-talent.access-token", value: "workspace-e2e", url: baseURL },
    { name: "mosaic-talent.abp-tenant-id", value: "1", url: baseURL },
    { name: "mosaic-talent.e2e", value: "1", url: baseURL },
  ]);
  await page.route("**/api/services/app/Session/GetCurrentLoginInformations", (route) => route.fulfill(ok({ user: { id: 42, userName: "jane", name: "Jane", surname: "Developer" } })));
  await page.route("**/api/services/app/DeveloperOnboarding/GetMyProfile", (route) => route.fulfill(ok({ userId: 42, hasCompletedOnboarding: true, githubUsername: "jane", studyLevel: 1, skills: [], goals: [] })));

  const project = {
    id: "project-1", title: "Study Group", description: "A private study group.",
    problemStatement: "Students need a shared place to organize their work.", isPublic: false,
    difficulty: "beginner", estimatedHoursPerWeek: 4, githubRepo: "", skills: [],
    type: "group", status: "open", ownerId: "member-1", createdAt: "2026-10-21T00:00:00Z",
    members: [{ id: "member-1", name: "Jane Developer", userName: "jane", role: "lead" }], tasks: [],
  };
  await page.route("**/api/services/app/DeveloperProject/GetMyProjects", (route) => route.fulfill(ok([project])));
  await page.route("**/api/services/app/DeveloperProject/GetProject?**", (route) => route.fulfill(ok(project)));

  let wikiPage: Record<string, unknown> | undefined;
  let resource: Record<string, unknown> | undefined;
  await page.route("**/api/services/app/ProjectWorkspace/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/GetWikiPages")) return route.fulfill(ok(wikiPage ? [wikiPage] : []));
    if (path.endsWith("/GetResources")) return route.fulfill(ok(resource ? [resource] : []));
    if (path.endsWith("/SaveWikiPage")) {
      wikiPage = { id: "wiki-1", projectId: "project-1", createdByDeveloperId: "member-1", ...route.request().postDataJSON(), creationTime: "2026-10-21T00:00:00Z" };
      return route.fulfill(ok(wikiPage));
    }
    if (path.endsWith("/AddResource")) {
      resource = { id: "resource-1", projectId: "project-1", addedByDeveloperId: "member-1", ...route.request().postDataJSON(), creationTime: "2026-10-21T00:00:00Z" };
      return route.fulfill(ok(resource));
    }
    return route.fulfill(ok({}));
  });

  await page.goto("/app/projects/project-1");
  await page.getByRole("tab", { name: /Wiki & resources/ }).click();
  await expect(page.getByRole("heading", { name: "Project wiki" })).toBeVisible();
  await page.getByPlaceholder("Page title, for example: Setup guide").fill("Getting started");
  await page.getByPlaceholder("Write notes in Markdown so teammates can follow the steps.").fill("Install dependencies, then run the tests.");
  await page.getByRole("button", { name: "Save page" }).click();
  await expect(page.getByText("Install dependencies, then run the tests.")).toBeVisible();

  await page.getByPlaceholder("Resource name, for example: Figma design").fill("Team design");
  await page.getByPlaceholder("https://example.com/team-resource").fill("https://example.com/design");
  await page.getByRole("button", { name: "Add resource" }).click();
  await expect(page.getByRole("link", { name: "Team design" })).toBeVisible();

  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
