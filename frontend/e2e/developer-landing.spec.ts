import { expect, test } from "@playwright/test";

for (const width of [360, 768, 1280]) {
  test(`developer landing leads to signup at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /build with people.*grow with purpose/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();
    await expect(page.getByRole("link", { name: /create your free account/i })).toHaveAttribute("href", "/signup");
    await expect(page.getByText("GitHub connection is optional during onboarding.")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    if (width === 360) {
      await page.getByRole("link", { name: /create your free account/i }).click();
      await expect(page).toHaveURL(/\/signup$/);
      await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    }
  });
}
