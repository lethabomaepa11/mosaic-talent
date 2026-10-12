import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test("logout calls the backend with its HttpOnly session and clears the frontend token", async ({ page }) => {
  let logoutCookieHeader = "";
  await page.context().addCookies([
    { name: "mosaic-talent.access-token", value: "e2e-token", url: "http://127.0.0.1:3000" },
    { name: "mosaic-talent.abp-tenant-id", value: "1", url: "http://127.0.0.1:3000" },
    { name: "mosaic-talent.server-access-token", value: "http-only-token", url: "http://127.0.0.1:3000", httpOnly: true },
    { name: "mosaic-talent.server-abp-tenant-id", value: "1", url: "http://127.0.0.1:3000", httpOnly: true },
  ]);

  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/TokenAuth/Logout")) {
      logoutCookieHeader = route.request().headers().cookie ?? "";
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: null }) });
      return;
    }
    if (url.pathname.endsWith("/Session/GetCurrentLoginInformations")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { user: { id: 99, userName: "octocat", name: "Octo", surname: "Cat" } } }) });
      return;
    }
    if (url.pathname.endsWith("/DeveloperOnboarding/GetMyProfile")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { userId: 99, hasCompletedOnboarding: true, skills: ["React"], goals: [], githubUsername: "" } }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: [] }) });
  });

  await page.goto("/app/projects/my");
  await expect(page.locator("[data-ai-page='projects-my']")).toBeVisible();
  await page.getByRole("button", { name: "Sign Out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(logoutCookieHeader).toContain("mosaic-talent.server-access-token=http-only-token");
  const cookies = await page.context().cookies("http://127.0.0.1:3000");
  expect(cookies.some((cookie) => cookie.name === "mosaic-talent.access-token")).toBe(false);
});
