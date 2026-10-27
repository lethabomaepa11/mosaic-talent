import { expect, test } from "@playwright/test";

const jsonOk = (result: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ result }),
});

test("filters, sorts, and switches active and past projects", async ({ page, baseURL }) => {
  const appUrl = baseURL ?? "http://127.0.0.1:3000";
  await page.addInitScript(() => { document.cookie = "mosaic-talent.e2e=1; path=/"; });
  await page.context().addCookies([
    { name: "mosaic-talent.access-token", value: "e2e-token", url: appUrl },
    { name: "mosaic-talent.abp-tenant-id", value: "1", url: appUrl },
    { name: "mosaic-talent.e2e", value: "1", url: appUrl },
  ]);
  await page.route("**/api/services/app/Session/GetCurrentLoginInformations", (route) =>
    route.fulfill(jsonOk({ user: { id: 99, userName: "octocat", name: "Octo", surname: "Cat" } })),
  );
  await page.route("**/api/services/app/DeveloperOnboarding/GetMyProfile", (route) =>
    route.fulfill(jsonOk({ userId: 99, hasCompletedOnboarding: true, githubUsername: "octocat", studyLevel: 1, teamworkRating: 8, skills: [], goals: [] })),
  );
  await page.route("**/api/services/app/DeveloperProject/GetMyProjects", (route) => route.fulfill(jsonOk([
    { id: "active-zeta", title: "Zeta Frontend", description: "Build a React app", problemStatement: "Learners need a simpler portfolio builder.", isPublic: false, maxMembers: 4, estimatedHoursPerWeek: 8, difficulty: "beginner", skills: ["React"], type: "group", status: "in-progress", ownerId: "owner-1", createdAt: "2026-05-01T00:00:00.000Z", members: [], tasks: [] },
    { id: "active-alpha", title: "Alpha API", description: "Build a Python API", problemStatement: "Study groups need reliable shared data.", isPublic: true, maxMembers: 4, estimatedHoursPerWeek: 4, difficulty: "advanced", skills: ["Python"], type: "group", status: "open", ownerId: "owner-2", createdAt: "2026-06-01T00:00:00.000Z", members: [], tasks: [] },
    { id: "past-project", title: "Past Portfolio", description: "A completed project", problemStatement: "New developers struggle to show their work.", isPublic: true, maxMembers: 3, estimatedHoursPerWeek: 2, difficulty: "intermediate", skills: ["React"], type: "group", status: "completed", ownerId: "owner-3", createdAt: "2025-01-01T00:00:00.000Z", members: [], tasks: [] },
  ])));
  await page.route("**/api/services/app/DeveloperProject/GetOpenProjects", (route) => route.fulfill(jsonOk([])));

  await page.goto("/app/projects/my");
  await expect(page.getByText("Alpha API")).toBeVisible();
  await expect(page.getByText("Zeta Frontend")).toBeVisible();
  await expect(page.getByText("Past Portfolio")).toHaveCount(0);

  await page.getByRole("combobox", { name: "Sort my projects" }).click();
  await page.getByText("Name A–Z", { exact: true }).click();
  await expect(page.getByTestId("project-card").first().getByText("Alpha API")).toBeVisible();

  await page.getByRole("textbox", { name: "Search my projects" }).fill("Python");
  await expect(page.getByText("Alpha API")).toBeVisible();
  await expect(page.getByText("Zeta Frontend")).toHaveCount(0);
  await page.getByRole("textbox", { name: "Search my projects" }).clear();

  await page.locator(".ant-segmented-item").filter({ hasText: "Past" }).click();
  await expect(page.getByText("Past Portfolio")).toBeVisible();
  await expect(page.getByText("Alpha API")).toHaveCount(0);

  await page.getByRole("heading", { name: "My Projects" }).click();
  await expect(page.locator(".ant-select-dropdown:visible")).toHaveCount(0);
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
