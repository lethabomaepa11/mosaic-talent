import { expect, test } from "@playwright/test";

const jsonOk = (result: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ result }),
});

test("searches, filters, and sorts the open project list", async ({ page }) => {
  await page.addInitScript(() => {
    document.cookie = "mosaic-talent.e2e=1; path=/";
  });
  await page.context().addCookies([
    { name: "mosaic-talent.access-token", value: "e2e-token", url: "http://127.0.0.1:3000" },
    { name: "mosaic-talent.abp-tenant-id", value: "1", url: "http://127.0.0.1:3000" },
    { name: "mosaic-talent.e2e", value: "1", url: "http://127.0.0.1:3000" },
  ]);
  await page.route("**/api/services/app/Session/GetCurrentLoginInformations", (route) =>
    route.fulfill(jsonOk({ user: { id: 99, userName: "octocat", name: "Octo", surname: "Cat" } })),
  );
  await page.route("**/api/services/app/DeveloperOnboarding/GetMyProfile", (route) =>
    route.fulfill(jsonOk({ githubUsername: "octocat", studyLevel: 1, teamworkRating: 8, skills: [], goals: [] })),
  );
  await page.route("**/api/services/app/DeveloperProject/GetMyProjects", (route) => route.fulfill(jsonOk([])));
  await page.route("**/api/services/app/DeveloperProject/GetOpenProjects", (route) => route.fulfill(jsonOk([
    { id: "react-project", title: "React Dashboard", description: "Build a data dashboard", maxMembers: 4, estimatedHoursPerWeek: 6, difficulty: "beginner", skills: ["React", "TypeScript"], type: "group", status: "open", ownerId: "owner-1", createdAt: "2026-05-01T00:00:00.000Z", members: [], tasks: [] },
    { id: "python-project", title: "Python API", description: "Design a service API", maxMembers: 4, estimatedHoursPerWeek: 10, difficulty: "advanced", skills: ["Python"], type: "group", status: "open", ownerId: "owner-2", createdAt: "2026-06-01T00:00:00.000Z", members: [], tasks: [] },
  ])));

  await page.goto("/app/projects/open");
  await expect(page.getByText("React Dashboard")).toBeVisible();
  await expect(page.getByText("Python API")).toBeVisible();

  await page.getByRole("textbox", { name: "Search open projects" }).fill("TypeScript");
  await expect(page.getByText("React Dashboard")).toBeVisible();
  await expect(page.getByText("Python API")).toHaveCount(0);
  await page.getByRole("textbox", { name: "Search open projects" }).clear();
  await page.getByRole("combobox", { name: "Sort open projects" }).click();
  await page.getByText("Name A–Z", { exact: true }).click();
  await expect(page.locator(".ant-card").first().getByText("Python API")).toBeVisible();

  await page.getByRole("combobox", { name: "Filter by difficulty" }).click();
  await page.getByText("advanced", { exact: true }).last().click();
  await expect(page.getByText("Python API")).toBeVisible();
  await expect(page.getByText("React Dashboard")).toHaveCount(0);
  await page.getByRole("heading", { name: "Open Projects" }).click();
  await expect(page.locator(".ant-select-dropdown:visible")).toHaveCount(0);
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => ({
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
      elements: [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1)
        .slice(0, 8)
        .map((element) => `${element.tagName.toLowerCase()}.${element.className.toString().split(" ")[0]}:${Math.round(element.getBoundingClientRect().right)}`),
    }));
    expect(overflow.hasOverflow, `Unexpected horizontal overflow at ${width}px: ${overflow.elements.join(", ")}`).toBe(false);
  }
});
