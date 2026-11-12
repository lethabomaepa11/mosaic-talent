import { expect, test } from "@playwright/test";
import { setupBuildJourney } from "./build-journey-fixture";

const embed = "https://embed.tawk.to/6af5d41ae84c933e6cc134c5/1k7849236";
// Vendor test double only; the app still uses its real provider and script loader.
const vendorScript = `
  const api = window.Tawk_API;
  const widget = document.createElement('div');
  widget.setAttribute('role', 'dialog');
  widget.setAttribute('aria-label', 'Vendor support test');
  widget.hidden = true;
  document.body.appendChild(widget);
  Object.assign(api, {
    showWidget: () => { widget.hidden = false; },
    hideWidget: () => { widget.hidden = true; },
    maximize: () => { widget.textContent = 'Support widget opened'; }
  });
  api.onBeforeLoad(); api.onLoad();
`;

for (const width of [360, 768, 1440]) {
  test(`one accessible support launcher replaces Moahi at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let requests = 0;
    await page.route("https://embed.tawk.to/**", route => { requests++; return route.abort(); });
    for (const path of ["/login", "/signup", "/company/signup"]) {
      await page.goto(path);
      const trigger = page.getByRole("button", { name: "Support", exact: true });
      await expect(trigger).toHaveCount(1);
      await expect(trigger).toBeInViewport();
      await expect(page.getByText("Ask Moahi", { exact: true })).toHaveCount(0);
      await trigger.focus(); await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog", { name: "Support", exact: true });
      await expect(dialog.getByRole("button", { name: "Contact support" })).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
    }
    expect(requests).toBe(0);
  });
}

test("loads support only on request and reuses it after navigation", async ({ page }) => {
  let requests = 0;
  await page.route(embed, route => { requests++; return route.fulfill({ contentType: "text/javascript", body: vendorScript }); });
  await page.goto("/login");
  expect(requests).toBe(0);
  await page.getByRole("button", { name: "Support", exact: true }).click();
  expect(requests).toBe(0);
  await page.getByRole("button", { name: "Contact support" }).click();
  await expect(page.getByRole("dialog", { name: "Vendor support test" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Support", exact: true })).not.toBeVisible();
  await page.getByRole("button", { name: "Support", exact: true }).click();
  await page.getByRole("link", { name: /getting started guide/ }).click();
  await expect(page).toHaveURL(/\/how-to$/);
  await page.getByRole("button", { name: "Support", exact: true }).click();
  await page.getByRole("button", { name: "Contact support" }).click();
  await expect(page.getByRole("dialog", { name: "Vendor support test" })).toBeVisible();
  expect(requests).toBe(1);
  await expect(page.locator("#mosaic-support-widget")).toHaveCount(1);
});

test("blocked support remains recoverable and Help uses the same human support flow", async ({ page }) => {
  await setupBuildJourney(page);
  let fail = true;
  await page.route(embed, route => fail ? route.abort() : route.fulfill({ contentType: "text/javascript", body: vendorScript }));
  await page.goto("/app/help");
  await expect(page.getByRole("heading", { name: "Help & support" })).toBeVisible();
  await page.getByRole("main").getByRole("button", { name: "Contact support" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Support couldn't load");
  await expect(page.getByRole("main").getByRole("link", { name: /getting started guide/ })).toHaveAttribute("href", "/app/how-to");
  fail = false;
  await page.getByRole("main").getByRole("button", { name: "Contact support" }).click();
  await expect(page.getByRole("dialog", { name: "Vendor support test" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
});
