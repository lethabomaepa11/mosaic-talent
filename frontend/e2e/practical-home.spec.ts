import { expect, test } from "@playwright/test";
import { setupBuildJourney, teamBuilds } from "./build-journey-fixture";
import { jsonOk } from "./project-create-fixture";

test("a returning developer can see and open their task on the first phone screen", async ({ page }) => {
  await setupBuildJourney(page);
  const project = { ...teamBuilds[0], isMember: true, currentDeveloperId: "dev-99", canManage: true,
    project: { ...teamBuilds[0].project, tasks: [{ id: "task-1", title: "Add the chart filter", status: "in-progress", assignedMemberId: "dev-99" }] } };
  await page.route("**/api/services/app/BuildJourney/GetHome", route => route.fulfill(jsonOk({ profile: { userId: 99, fullName: "Octo Cat", skills: [], goals: [] }, developerId: "dev-99", myProjects: [project], openProjects: [] })));
  await page.route("**/api/services/app/BuildJourney/GetBuild*", route => route.fulfill(jsonOk(project)));
  await page.route("**/api/services/app/ProjectProgress/GetProjectProgressEntries*", route => route.fulfill(jsonOk([])));
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Home", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Add the chart filter", exact: true })).toBeInViewport();
  const open = page.getByRole("link", { name: "Open task", exact: true });
  await expect(open).toBeInViewport();
  await expect(page.getByRole("heading", { name: "Your projects", exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await open.click();
  await expect(page.getByRole("tab", { name: "Tasks", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Add the chart filter", exact: true })).toBeInViewport();
  for (const name of ["Tasks", "Overview", "Team", "Resources", "Work & feedback", "Settings"]) {
    await expect(page.getByRole("tab", { name, exact: true })).toBeInViewport();
  }
  await page.getByRole("button", { name: "Share work", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Work title" })).toBeVisible();
});

test("a new developer can start finding a project without scrolling", async ({ page }) => {
  await setupBuildJourney(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "You haven’t joined a project yet." })).toBeInViewport();
  const find = page.getByRole("main").getByRole("link", { name: "Find a project", exact: true });
  await expect(find).toBeInViewport();
  await find.click();
  await expect(page.getByRole("textbox", { name: "Search projects" })).toBeVisible();
});
