import { expect, test } from "@playwright/test";
import { setupOnboarding } from "./onboarding-fixture";

test.use({ serviceWorkers: "block" });

for (const width of [360, 768, 1280]) {
  test(`signup and optional steps work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const api = await setupOnboarding(page);
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("Jane Developer");
    await page.getByLabel("Email", { exact: true }).fill("jane@example.com");
    await page.getByLabel("Password", { exact: true }).fill("Strong123!");
    await expect(page.getByRole("button", { name: "Create account" })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByText("Jane Developer", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Skip GitHub" }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Add at least one skill" })).toBeVisible();
    await page.getByRole("combobox", { name: "Current skills" }).fill("Python");
    await page.getByRole("combobox", { name: "Current skills" }).press("Enter");
    await page.getByRole("combobox", { name: "Current skills" }).press("Escape");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByRole("button", { name: "Finish onboarding" })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/onboarding-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "Skip goals and finish" }).click();
    await expect(page).toHaveURL(/\/app\/projects\/my$/);
    expect(api.getProfile().hasCompletedOnboarding).toBe(true);
    expect(api.getProfile().githubUsername).toBe("");
    expect(api.saves.at(-1)).toMatchObject({ completeOnboarding: true, skills: ["Python"], goals: [] });
  });
}

test("rejects weak passwords and failed registration without a success redirect", async ({ page }) => {
  await setupOnboarding(page, { failRegistration: true });
  await page.goto("/signup");
  await page.getByLabel("Full name").fill("Jane Developer");
  await page.getByLabel("Email", { exact: true }).fill("jane@example.com");
  await page.getByLabel("Password", { exact: true }).fill("weak");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "strong password" })).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill("Strong123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /already registered/i })).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
});

test("protects direct app navigation and resumes a saved draft after refresh", async ({ page }) => {
  const api = await setupOnboarding(page, { authenticated: true });
  await page.goto("/app/projects/my");
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip GitHub" }).click();
  await page.getByRole("combobox", { name: "Current skills" }).fill("C#");
  await page.getByRole("combobox", { name: "Current skills" }).press("Enter");
  await page.getByRole("combobox", { name: "Current skills" }).press("Escape");
  await page.reload();
  await expect(page.getByText("C#", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Set your goals" })).toBeVisible();
  expect(api.getProfile().skills).toEqual(["C#"]);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByText("C#", { exact: true })).toBeVisible();
});

test("connects using the authenticated action and lets users edit imported skills", async ({ page }) => {
  const api = await setupOnboarding(page, { authenticated: true, step: 1 });
  await page.goto("/onboarding");
  await page.getByRole("button", { name: /Connect GitHub/ }).click();
  await expect(page.getByRole("heading", { name: "Choose your skills" })).toBeVisible();
  await expect(page.getByText("Python", { exact: true })).toBeVisible();
  expect(api.connectionStarted()).toBe(true);
  const importedTag = page.locator(".ant-select-selection-item").filter({ hasText: "TypeScript" });
  await importedTag.locator(".ant-select-selection-item-remove").click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("combobox", { name: "Learning goals (optional)" }).fill("Lead a team");
  await page.getByRole("combobox", { name: "Learning goals (optional)" }).press("Enter");
  await page.getByRole("combobox", { name: "Learning goals (optional)" }).press("Escape");
  await page.getByRole("button", { name: "Finish onboarding" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/my$/);
  expect(api.getProfile()).toMatchObject({ userId: 99, githubUsername: "jane-github", skills: ["Python"], goals: ["Lead a team"] });
});

test("allows manual skills when GitHub import is unavailable", async ({ page }) => {
  await setupOnboarding(page, { authenticated: true, connected: true, step: 1 });
  await page.route("**/GetGithubSkillSuggestions", (route) => route.fulfill({ status: 503, body: "unavailable" }));
  await page.goto("/onboarding?githubConnected=1");
  await expect(page.getByText("GitHub skills are unavailable. You can add your skills manually.")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Current skills" })).toBeEnabled();
});

test("retains skills after a failed save and supports retry", async ({ page }) => {
  const api = await setupOnboarding(page, { authenticated: true, step: 2 });
  let failSave = true;
  await page.route("**/UpsertMyProfile", (route) => failSave
    ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { message: "Please retry this save." } }) })
    : route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: api.getProfile() }) }));
  await page.goto("/onboarding");
  await page.getByRole("combobox", { name: "Current skills" }).fill("Java");
  await page.getByRole("combobox", { name: "Current skills" }).press("Enter");
  await page.getByRole("combobox", { name: "Current skills" }).press("Escape");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please retry this save." })).toBeVisible();
  await expect(page.locator(".ant-select-selection-item").filter({ hasText: "Java" })).toBeVisible();
  failSave = false;
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Set your goals" })).toBeVisible();
  expect(api.getProfile().skills).toEqual(["Java"]);
});

test("keeps app content hidden when profile loading fails and allows retry", async ({ page }) => {
  await setupOnboarding(page, { authenticated: true });
  await page.route("**/GetMyProfile", (route) => route.fulfill({ status: 503, body: "unavailable" }));
  await page.goto("/app/projects/my");
  await expect(page.getByText("Unable to load your profile", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "My projects", exact: true })).toHaveCount(0);
  await page.unroute("**/GetMyProfile");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
});
