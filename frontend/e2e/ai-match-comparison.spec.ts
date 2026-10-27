import { expect, test } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

const jsonOk = (result: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ result }),
});

const projects = [
  { id: "project-ai", title: "AI Recommended App", description: "A fit for your goals", problemStatement: "Small teams struggle to test accessible interfaces.", isPublic: true, maxMembers: 5, estimatedHoursPerWeek: 8, difficulty: "intermediate", matchScore: 91, matchInsight: "Your React experience aligns with the project, with room to grow in accessibility.", learningOutcomes: ["Accessible UI patterns"], skills: ["React", "TypeScript"], type: "group", status: "open", ownerId: "owner-1", createdAt: "2026-05-01T00:00:00.000Z", members: [], tasks: [] },
  { id: "project-two", title: "Open Source Toolkit", description: "Build a toolkit", problemStatement: "Contributors need clearer starter tooling.", isPublic: true, maxMembers: 4, estimatedHoursPerWeek: 6, difficulty: "beginner", matchScore: 78, skills: ["TypeScript"], type: "group", status: "open", ownerId: "owner-2", createdAt: "2026-04-01T00:00:00.000Z", members: [], tasks: [] },
  { id: "project-three", title: "Design System", description: "Create a shared design system", problemStatement: "Teams repeat the same interface patterns.", isPublic: true, maxMembers: 4, estimatedHoursPerWeek: 10, difficulty: "advanced", matchScore: 72, skills: ["React", "CSS"], type: "group", status: "open", ownerId: "owner-3", createdAt: "2026-03-01T00:00:00.000Z", members: [], tasks: [] },
];

test("shows and compares three AI project matches on the post-login Discover page", async ({ page }) => {
  await page.addInitScript(() => { document.cookie = "mosaic-talent.e2e=1; path=/"; });
  await page.context().addCookies([
    { name: "mosaic-talent.access-token", value: "e2e-token", url: baseURL },
    { name: "mosaic-talent.abp-tenant-id", value: "1", url: baseURL },
    { name: "mosaic-talent.e2e", value: "1", url: baseURL },
  ]);
  await page.route("**/api/services/app/Session/GetCurrentLoginInformations", (route) =>
    route.fulfill(jsonOk({ user: { id: 99, userName: "octocat", name: "Octo", surname: "Cat" } })),
  );
  await page.route("**/api/services/app/DeveloperOnboarding/GetMyProfile", (route) =>
    route.fulfill(jsonOk({ userId: 99, hasCompletedOnboarding: true, githubUsername: "octocat", studyLevel: 1, teamworkRating: 8, skills: ["React"], goals: [] })),
  );
  await page.route("**/api/services/app/DeveloperProject/GetMyProjects", (route) => route.fulfill(jsonOk([])));
  await page.route("**/api/services/app/DeveloperProject/GetOpenProjects", (route) => route.fulfill(jsonOk(projects)));
  await page.route("**/api/services/app/DeveloperProject/AiMatchProject", (route) => route.fulfill(jsonOk(projects[0])));

  await page.goto("/app/projects/open");
  await page.getByRole("button", { name: "AI Match Me" }).click();

  const comparison = page.getByRole("region", { name: "AI project matches" });
  await expect(comparison.getByText("AI pick")).toBeVisible();
  await expect(comparison.getByText("AI Recommended App")).toBeVisible();
  await expect(comparison.getByText("Open Source Toolkit")).toBeVisible();
  await expect(comparison.getByText("Design System")).toBeVisible();
  await expect(comparison.getByTestId("project-match")).toHaveCount(3);
  await expect(comparison.getByText("Small teams struggle to test accessible interfaces.")).toBeVisible();

  const grid = comparison.getByTestId("ai-match-grid");
  for (const [width, columns] of [[360, 1], [768, 2], [1280, 3]]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(async () => grid.evaluate((element) =>
      getComputedStyle(element).gridTemplateColumns.split(" ").length,
    )).toBe(columns);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
