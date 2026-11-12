import { expect, test } from "@playwright/test";
import { jsonOk, setupProjectCreation } from "./project-create-fixture";
test.beforeEach(setupProjectCreation);

test("retries a failed feed, keeps failed drafts, and shows a confirmed save when refresh fails", async ({ page }) => {
  let feedFails = true;
  let writeFails = true;
  let writes = 0;
  let releaseWrite: () => void = () => undefined;
  const writeGate = new Promise<void>((resolve) => { releaseWrite = resolve; });
  const idea = { id: "saved-idea", creatorName: "Octo Cat", title: "Community notes", problemStatement: "Notes get lost",
    proposedSolution: "A shared notebook", createdAt: "2026-11-07T00:00:00Z", isOwner: true, isPublic: false,
    isConverted: false, comments: [], interestedCount: 0, likeCount: 0, dislikeCount: 0 };
  await page.route("**/api/services/app/Ideator/GetFeed", (route) => route.fulfill(feedFails
    ? { status: 503, contentType: "application/json", body: JSON.stringify({ error: { message: "Unavailable" } }) }
    : jsonOk([])));
  await page.route("**/api/services/app/Ideator/CreateIdea", async (route) => {
    writes++;
    if (writeFails) return route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
    await writeGate;
    return route.fulfill(jsonOk(idea));
  });
  await page.goto("/app/ideator");
  await expect(page.getByText("Ideas could not be refreshed", { exact: true })).toBeVisible();
  await expect(page.getByText(/No ideas yet/)).toHaveCount(0);
  feedFails = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByText(/No ideas yet/)).toBeVisible();
  await page.getByRole("button", { name: "Post an idea" }).click();
  await page.getByRole("textbox", { name: "Idea title", exact: true }).fill(idea.title);
  await page.getByRole("textbox", { name: "Problem statement", exact: true }).fill(idea.problemStatement);
  await page.getByRole("textbox", { name: "Proposed solution", exact: true }).fill(idea.proposedSolution);
  await page.getByRole("checkbox", { name: "Share this idea publicly" }).uncheck();
  await page.getByRole("button", { name: "Post idea", exact: true }).click();
  await expect(page.getByText("Could not share idea", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Idea title", exact: true })).toHaveValue(idea.title);
  writeFails = false; feedFails = true;
  await page.getByRole("button", { name: "Post idea", exact: true }).click();
  await expect(page.getByRole("button", { name: /Post idea/ })).toBeDisabled();
  await expect.poll(() => writes).toBe(2);
  releaseWrite();
  await expect(page.getByRole("heading", { name: idea.title })).toBeVisible();
  await expect(page.getByText("Your private idea is visible only to you.", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Idea title", exact: true })).toHaveValue("");
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
  expect(writes).toBe(2);
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
