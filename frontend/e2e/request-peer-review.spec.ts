import { expect, test } from "@playwright/test";

const jsonOk = (result: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ result }),
});

test("requests an early peer review for an eligible active project", async ({ page, baseURL }) => {
  const appUrl = baseURL ?? "http://127.0.0.1:3000";
  await page.addInitScript(() => { document.cookie = "mosaic-talent.e2e=1; path=/"; });
  await page.context().addCookies([
    { name: "mosaic-talent.access-token", value: "e2e-token", url: appUrl },
    { name: "mosaic-talent.abp-tenant-id", value: "1", url: appUrl },
    { name: "mosaic-talent.e2e", value: "1", url: appUrl },
  ]);
  await page.route("**/api/services/app/Session/GetCurrentLoginInformations", (route) =>
    route.fulfill(jsonOk({ user: { id: 99, userName: "octocat", name: "Octo", surname: "Cat" } })),
  );
  await page.route("**/api/services/app/DeveloperOnboarding/GetMyProfile", (route) =>
    route.fulfill(jsonOk({ userId: 99, hasCompletedOnboarding: true, githubUsername: "octocat", studyLevel: 1, teamworkRating: 8, skills: [], goals: [] })),
  );
  await page.route("**/api/services/app/PeerReview/GetMyProjectPeerReviews", (route) => route.fulfill(jsonOk([])));
  const projectReview = {
    projectId: "project-123",
    projectTitle: "Collaboration Project",
    projectStatus: "in-progress",
    canRequestPeerReview: true,
    peerReviewRequestMessage: "Request an anonymous review from your project teammates.",
    assignedToMe: [],
    receivedByMe: [],
  };
  await page.route("**/api/services/app/PeerReview/GetProjectPeerReviews?**", (route) => route.fulfill(jsonOk(projectReview)));
  let requestCount = 0;
  await page.route("**/api/services/app/PeerReview/RequestProjectPeerReview", async (route) => {
    requestCount += 1;
    await route.fulfill(jsonOk({ ...projectReview, canRequestPeerReview: false, peerReviewRequestMessage: "You can request another review in 14 day(s)." }));
  });

  await page.goto("/app/reviews/project-123");
  const requestButton = page.getByRole("button", { name: "Request Peer Review" });
  await expect(requestButton).toBeEnabled();
  await requestButton.click();
  await expect.poll(() => requestCount).toBe(1);
  await expect(page.getByText("You can request another review in 14 day(s).")).toBeVisible();

  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
