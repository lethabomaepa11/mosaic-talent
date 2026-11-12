import { expect, test } from "@playwright/test";

test("public pages are readable and navigable without JavaScript", async ({browser,baseURL}) => {
  const context = await browser.newContext({baseURL,javaScriptEnabled:false,viewport:{width:360,height:800}});
  const page = await context.newPage();
  await page.goto("/");
  await expect(page).toHaveTitle("mosaic.talent");
  await expect(page.getByRole("heading",{level:1})).toHaveText("Build a project with other developers.");
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("lang","en");
  await expect(page.locator('a button,button a')).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link",{name:"Skip to content"})).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await expect(page.getByRole("link",{name:"Create account",exact:true}).first()).toHaveAttribute("href","/signup");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto("/how-to");
  await expect(page).toHaveTitle("Getting started | mosaic.talent");
  await expect(page.getByRole("heading",{level:1})).toBeVisible();
  await expect(page.locator('a button,button a')).toHaveCount(0);
  await context.close();
});

test("serves canonical metadata, a usable share image, sitemap and private-route noindex headers", async ({page,request}) => {
  await page.goto("/");
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(new URL(canonical!).protocol).toBe("https:");
  expect(new URL(canonical!).pathname).toBe("/");
  const origin = new URL(canonical!).origin;
  expect(new URL((await page.locator('meta[property="og:url"]').getAttribute("content"))!).href).toBe(`${origin}/`);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content","summary_large_image");
  const share = new URL((await page.locator('meta[property="og:image"]').getAttribute("content"))!);
  const image = await request.get(share.pathname+share.search);
  expect(image.ok()).toBe(true);expect(image.headers()["content-type"]).toContain("image/png");
  const png = await image.body();expect(png.readUInt32BE(16)).toBe(1200);expect(png.readUInt32BE(20)).toBe(630);
  const map = await request.get("/sitemap.xml");expect(map.ok()).toBe(true);
  const xml = await map.text();expect(xml).toContain(`<loc>${origin}/</loc>`);expect(xml).toContain(`<loc>${origin}/how-to</loc>`);expect(xml).not.toContain("/app");
  const rules = await request.get("/robots.txt");expect(rules.ok()).toBe(true);
  expect(await rules.text()).toContain(`Sitemap: ${origin}/sitemap.xml`);
  for (const path of ["/app","/app/work","/login","/signup","/onboarding","/github/connect","/company/signup"]) {
    const response = await request.get(path);expect(response.headers()["x-robots-tag"],path).toBe("noindex, nofollow");
  }
  await page.goto("/how-to");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href",`${origin}/how-to`);
});
