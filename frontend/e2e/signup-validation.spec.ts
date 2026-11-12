import { expect, test } from "@playwright/test";

test("signup explains the password limit and displays actionable API field errors", async ({ page }) => {
  await page.route("**/api/TokenAuth/GetAccessToken", (route) => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify({ result: "" }),
  }));
  await page.route("**/api/services/app/Account/Register", (route) => route.fulfill({
    status: 400, contentType: "application/json", body: JSON.stringify({ error: {
      message: "Your request is not valid!", validationErrors: [{ message: "This email is already registered. Sign in instead." }],
    } }),
  }));
  await page.goto("/signup");
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("maxlength", "32");
  await expect(page.getByText(/8 to 32 characters/)).toBeVisible();
  await page.getByLabel("Full name", { exact: true }).fill("Developer Learner");
  await page.getByLabel("Email", { exact: true }).fill("developer@example.invalid");
  await page.getByLabel("Password", { exact: true }).fill("Strong1!password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "This email is already registered. Sign in instead." })).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("developer@example.invalid");
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
