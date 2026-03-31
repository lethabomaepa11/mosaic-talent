import { expect, test, type Page } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const jsonOk = (body: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({
    result: body,
  }),
});

const setupProfileRoutes = async (page: Page) => {
  let profileHits = 0;
  let learningPathHits = 0;
  let gamificationHits = 0;

  await page.route("**/*", async (route) => {
    const url = route.request().url();

    if (url.includes("/api/services/app/Session/GetCurrentLoginInformations")) {
      await route.fulfill(
        jsonOk({
          user: {
            id: 99,
            userName: "octocat",
            name: "Octo",
            surname: "Cat",
            emailAddress: "octo@example.com",
          },
        }),
      );
      return;
    }

    if (url.includes("/api/services/app/DeveloperOnboarding/GetMyProfile")) {
      profileHits += 1;
      await route.fulfill(
        jsonOk({
          githubUsername: "octocat",
          studyLevel: 1,
          teamworkRating: 8,
          skills: ["React", "TypeScript"],
          goals: ["Become a stronger backend engineer"],
        }),
      );
      return;
    }

    if (url.includes("/api/services/app/DeveloperOnboarding/GetStudyLevels")) {
      await route.fulfill(jsonOk([{ value: 1, label: "Diploma" }]));
      return;
    }

    if (url.includes("/api/services/app/DeveloperOnboarding/GetMyLearningPathRecommendations")) {
      learningPathHits += 1;
      await route.fulfill(
        jsonOk({
          source: "ai",
          summary: "Path built from your current profile and role targets.",
          marketSignals: ["Backend Engineer: .NET, API Design, PostgreSQL"],
          recommendations: [
            {
              goal: "Become a stronger backend engineer",
              priority: "high",
              estimatedWeeks: 8,
              gapSummary: "Strengthen API design and automated testing depth.",
              recommendedSkills: ["API Design", "Testing"],
              suggestedActions: ["Ship one .NET API module with integration tests."],
            },
          ],
        }),
      );
      return;
    }

    if (url.includes("/api/services/app/DeveloperOnboarding/GetMyGamificationSummary")) {
      gamificationHits += 1;
      await route.fulfill(
        jsonOk({
          totalPoints: 280,
          level: 3,
          nextLevelPoints: 300,
          progressPercent: 80,
          badges: [
            {
              code: "first_contribution",
              name: "First Contribution",
              description: "First points earned",
              earnedAt: "2026-03-30T00:00:00.000Z",
            },
            {
              code: "project_finisher",
              name: "Project Finisher",
              description: "Completed first project",
              earnedAt: "2026-03-30T00:00:00.000Z",
            },
          ],
          recentEvents: [
            {
              eventType: "peer_review_completed",
              pointsAwarded: 30,
              occurredAt: "2026-03-30T00:00:00.000Z",
            },
          ],
        }),
      );
      return;
    }

    await route.continue();
  });

  return {
    getProfileHits: () => profileHits,
    getLearningPathHits: () => learningPathHits,
    getGamificationHits: () => gamificationHits,
  };
};

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    console.error("pageerror", error);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      console.error("console", message.text());
    }
  });
  await page.addInitScript(() => {
    document.cookie = "mosaic-talent.e2e=1; path=/";
  });
  await page.context().addCookies([
    {
      name: "mosaic-talent.access-token",
      value: "e2e-token",
      url: "http://127.0.0.1:3000",
    },
    {
      name: "mosaic-talent.abp-tenant-id",
      value: "1",
      url: "http://127.0.0.1:3000",
    },
    {
      name: "mosaic-talent.e2e",
      value: "1",
      url: "http://127.0.0.1:3000",
    },
  ]);
});

test("renders AI learning path recommendations from profile data", async ({ page }) => {
  const apiHits = await setupProfileRoutes(page);

  await page.goto("/app/profile");

  await page.waitForSelector("[data-ai-page='profile']", { state: "attached" });

  await expect.poll(() => apiHits.getProfileHits()).toBeGreaterThan(0);
  await expect.poll(() => apiHits.getLearningPathHits()).toBeGreaterThan(0);
  await expect.poll(() => apiHits.getGamificationHits()).toBeGreaterThan(0);

  await expect(page.locator("[data-ai-section='gamification']")).toBeVisible();
  await expect(page.getByText("Level 3")).toBeVisible();
  await expect(page.getByText("280 pts")).toBeVisible();
  await expect(page.getByText("First Contribution")).toBeVisible();

  await expect(page.locator("[data-ai-section='learning-path']")).toBeVisible();
  await expect(page.getByText("Path built from your current profile and role targets.")).toBeVisible();
  await expect(
    page
      .locator("[data-ai-section='learning-path']")
      .getByText("Become a stronger backend engineer")
      .first(),
  ).toBeVisible();
  await expect(page.getByText("Ship one .NET API module with integration tests.")).toBeVisible();
});
