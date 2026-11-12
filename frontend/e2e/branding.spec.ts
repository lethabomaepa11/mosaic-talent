import { expect, test } from "@playwright/test";
import { setupBuildJourney } from "./build-journey-fixture";
import { jsonOk } from "./project-create-fixture";

test("uses the original logo and mosaic.talent name across themes, navigation and app metadata", async ({ page, request }) => {
  await setupBuildJourney(page);
  await page.route("**/api/services/app/NotificationChannel/GetMyNotifications*", route => route.fulfill(jsonOk({ items: [], totalCount: 0, unreadCount: 0 })));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/app/projects/open");
  await expect(page).toHaveTitle("mosaic.talent");
  const sidebar = page.getByRole("complementary", { name: "Workspace navigation" });
  const logo = sidebar.getByRole("img", { name: "mosaic.talent", exact: true });
  await expect(logo).toHaveAttribute("src", "/text-logo-light.svg");
  await page.getByRole("button", { name: "Notifications", exact: true }).click();
  await expect(page.getByText("No notifications yet.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(logo).toHaveAttribute("src", "/text-logo.svg");
  await sidebar.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(logo).toHaveAttribute("src", "/logo.svg");
  await sidebar.getByRole("button", { name: "Expand sidebar" }).click();
  await expect(logo).toHaveAttribute("src", "/text-logo.svg");

  await page.setViewportSize({ width: 360, height: 800 });
  await expect(page.getByRole("img", { name: "mosaic.talent", exact: true })).toHaveAttribute("src", "/text-logo.svg");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  expect(await manifest.json()).toMatchObject({ name: "mosaic.talent", short_name: "mosaic.talent", icons: expect.arrayContaining([expect.objectContaining({ src: "/logo.svg" })]) });

  await page.context().clearCookies();
  await page.goto("/signup");
  await expect(page.getByRole("img", { name: "mosaic.talent", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create account", exact: true })).toBeVisible();
});
