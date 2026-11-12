import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

const apiBase = process.env.LOCAL_LIVE_API_URL ?? "";
test.skip(!apiBase, "Opt in with LOCAL_LIVE_API_URL for an isolated local PostgreSQL-backed API.");

test("real signup, onboarding, idea conversion, consent-based team joining, and wiki collaboration", async ({ page, request }) => {
  test.setTimeout(180_000);
  expect(["127.0.0.1", "localhost"]).toContain(new URL(apiBase).hostname);
  const suffix = randomUUID().slice(0, 8);
  const password = `Local!${randomUUID().slice(0, 16)}Aa27`;
  await page.goto("/signup");
  await page.getByLabel("Full name", { exact: true }).fill("Local Collaboration Check");
  await page.getByLabel("Email", { exact: true }).fill(`local-${suffix}@example.invalid`);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip GitHub", exact: true }).click();
  await page.getByRole("combobox", { name: "Current skills" }).fill("TypeScript");
  await page.getByRole("combobox", { name: "Current skills" }).press("Enter");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Finish setup", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);

  const tenantHeaders = { "Abp-TenantId": "1" };
  const guestEmail = `teammate-${suffix}@example.invalid`;
  const registration = await request.post(`${apiBase}/api/services/app/Account/Register`, {
    headers: tenantHeaders, data: { fullName: "Local Teammate Check", emailAddress: guestEmail, password },
  });
  expect(registration.ok()).toBe(true);
  const login = await request.post(`${apiBase}/api/TokenAuth/Authenticate`, {
    headers: tenantHeaders, data: { userNameOrEmailAddress: guestEmail, password },
  });
  expect(login.ok()).toBe(true);
  const guestToken = (await login.json()).result.accessToken;
  const guestHeaders = { ...tenantHeaders, Authorization: `Bearer ${guestToken}` };
  const profile = await request.post(`${apiBase}/api/services/app/DeveloperOnboarding/UpsertMyProfile`, {
    headers: guestHeaders, data: { completeOnboarding: true, skills: ["TypeScript"], goals: [], studyLevel: 1 },
  });
  expect(profile.ok()).toBe(true);

  await page.goto("/app/ideator");
  const ideaTitle = `Build together ${suffix}`;
  await page.getByRole("button", { name: "Post an idea" }).click();
  await page.getByRole("textbox", { name: "Idea title", exact: true }).fill(ideaTitle);
  await page.getByRole("textbox", { name: "Problem statement", exact: true }).fill("Developers need practical team experience.");
  await page.getByRole("textbox", { name: "Proposed solution", exact: true }).fill("Build a shared learning notebook.");
  await page.getByRole("button", { name: "Post idea", exact: true }).click();
  await expect(page.getByRole("heading", { name: ideaTitle })).toBeVisible();
  const guestFeed = await request.get(`${apiBase}/api/services/app/Ideator/GetFeed`, { headers: guestHeaders });
  expect(guestFeed.ok()).toBe(true);
  const idea = (await guestFeed.json()).result.find((entry: { title: string }) => entry.title === ideaTitle);
  expect(idea).toBeDefined();
  const reaction = await request.post(`${apiBase}/api/services/app/Ideator/React`, {
    headers: guestHeaders, data: { ideaPostId: idea.id, type: "Interested" },
  });
  expect(reaction.ok()).toBe(true);
  const post = page.getByRole("article").filter({ has: page.getByRole("heading", { name: ideaTitle }) });
  await post.getByRole("button", { name: "Start a project", exact: true }).click();
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  const openProject = post.getByRole("link", { name: "View project", exact: true });
  await expect(openProject).toBeVisible();
  const projectPath = await openProject.getAttribute("href");
  const projectId = projectPath!.split("/").pop()!;
  const beforeAccept = await request.get(`${apiBase}/api/services/app/DeveloperProject/GetMyProjects`, { headers: guestHeaders });
  expect((await beforeAccept.json()).result.some((entry: { id: string }) => entry.id === projectId)).toBe(false);
  const inaccessibleWiki = await request.get(`${apiBase}/api/services/app/ProjectWorkspace/GetWikiPages`, { headers: guestHeaders, params: { projectId } });
  expect(inaccessibleWiki.ok()).toBe(false);
  const invitesResponse = await request.get(`${apiBase}/api/services/app/DeveloperProject/GetProjectInvites`, { headers: guestHeaders, params: { projectId } });
  expect(invitesResponse.ok()).toBe(true);
  const invite = (await invitesResponse.json()).result.find((entry: { status: string }) => entry.status === "pending");
  expect(invite).toBeDefined();
  const accept = await request.post(`${apiBase}/api/services/app/DeveloperProject/AcceptProjectInvite`, {
    headers: guestHeaders, data: { projectId, inviteId: invite.id },
  });
  expect(accept.ok()).toBe(true);
  const afterAccept = await request.get(`${apiBase}/api/services/app/DeveloperProject/GetMyProjects`, { headers: guestHeaders });
  expect((await afterAccept.json()).result.some((entry: { id: string }) => entry.id === projectId)).toBe(true);
  const wiki = await request.post(`${apiBase}/api/services/app/ProjectWorkspace/SaveWikiPage`, {
    headers: guestHeaders, data: { projectId, title: "Team setup", contentMarkdown: "Agree on a small first milestone and review one another’s work." },
  });
  expect(wiki.ok()).toBe(true);
  await page.goto(projectPath!);
  await page.getByRole("tab", { name: "Resources" }).click();
  await expect(page.getByText("Agree on a small first milestone and review one another’s work.")).toBeVisible();
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
