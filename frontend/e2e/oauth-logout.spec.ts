import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test("logout calls the backend with its HttpOnly session and clears the frontend token", async ({ page }) => {
  let logoutCookieHeader = "";
  let apiHostname = "";
  await page.context().addCookies([
    { name: "mosaic-talent.access-token", value: "e2e-token", url: "http://127.0.0.1:3000" },
    { name: "mosaic-talent.abp-tenant-id", value: "1", url: "http://127.0.0.1:3000" },
    { name: "mosaic-talent.server-access-token", value: "http-only-token", url: "http://127.0.0.1:3000", httpOnly: true },
    { name: "mosaic-talent.server-abp-tenant-id", value: "1", url: "http://127.0.0.1:3000", httpOnly: true },
  ]);

  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/TokenAuth/Logout")) {
      logoutCookieHeader = (await route.request().allHeaders()).cookie ?? "";
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: null }) });
      return;
    }
    if (url.pathname.endsWith("/Session/GetCurrentLoginInformations")) {
      apiHostname = url.hostname;
      await page.context().addCookies([
        {name:"mosaic-talent.server-access-token",value:"http-only-token",url:url.origin,httpOnly:true},
        {name:"mosaic-talent.server-abp-tenant-id",value:"1",url:url.origin,httpOnly:true},
      ]);
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
  // The phone preview uses a LAN API. Keep this cookie test on that same site,
  // since browsers correctly withhold Lax cookies from a different IP site.
  const preview = new URL(page.url());
  if (apiHostname !== preview.hostname && /^(192\.168\.|10\.|127\.)/.test(apiHostname)) {
    preview.hostname=apiHostname;
    await page.context().addCookies([
      {name:"mosaic-talent.access-token",value:"e2e-token",url:preview.origin},
      {name:"mosaic-talent.abp-tenant-id",value:"1",url:preview.origin},
    ]);
    await page.goto(preview.href);
    await expect(page.locator("[data-ai-page='projects-my']")).toBeVisible();
  }
  await page.getByRole("button", { name: "Sign Out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(logoutCookieHeader).toContain("mosaic-talent.server-access-token=http-only-token");
  const cookies = await page.context().cookies(new URL(page.url()).origin);
  expect(cookies.some((cookie) => cookie.name === "mosaic-talent.access-token")).toBe(false);
});
