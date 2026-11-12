import { expect, test } from "@playwright/test";
import { setupBuildJourney, teamBuilds } from "./build-journey-fixture";
import { jsonOk } from "./project-create-fixture";

test("desktop navigation stays in the viewport while a long page scrolls", async ({ page }) => {
  await setupBuildJourney(page);
  const projects = Array.from({ length: 16 }, (_, index) => ({
    ...teamBuilds[0],
    project: { ...teamBuilds[0].project, id: `scroll-project-${index}`, title: `Project ${index + 1}` },
  }));
  await page.route("**/api/services/app/BuildJourney/GetHome", route => route.fulfill(jsonOk({
    profile: { skills: [], goals: [] }, developerId: "dev-99", myProjects: [], openProjects: projects,
  })));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/app/projects/open");
  await expect(page.getByTestId("build-card")).toHaveCount(16);

  const sidebar = page.getByRole("complementary", { name: "Workspace navigation" });
  const firstProject = page.getByTestId("build-card").first();
  const assertPinned = async (width: number) => {
    await expect.poll(async () => sidebar.evaluate(element => Math.abs(element.getBoundingClientRect().top))).toBeLessThan(1);
    await expect.poll(async () => sidebar.evaluate(element => Math.round(element.getBoundingClientRect().width))).toBe(width);
    await expect(sidebar.getByRole("button", { name: "Sign Out" })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  };

  const firstTop = await firstProject.evaluate(element => element.getBoundingClientRect().top);
  await page.evaluate(() => window.scrollTo(0, 900));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(800);
  expect(await firstProject.evaluate(element => element.getBoundingClientRect().top)).toBeLessThan(firstTop - 800);
  await assertPinned(240);
  await sidebar.getByRole("button", { name: "Collapse sidebar" }).click();
  await page.evaluate(() => window.scrollTo(0, 1600));
  await assertPinned(76);
  await sidebar.getByRole("button", { name: "Expand sidebar" }).click();
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await assertPinned(240);

  for (const width of [768, 360]) {
    await page.setViewportSize({ width, height: 800 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(sidebar).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Developer mobile navigation" })).toBeInViewport();
    await expect(page.getByRole("textbox", { name: "Search projects" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
