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

    await route.continue();
  });

  return {
    getProfileHits: () => profileHits,
    getLearningPathHits: () => learningPathHits,
  };
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.cookie = "mosaic-talent.access-token=e2e-token; path=/; SameSite=Lax";
    document.cookie = "mosaic-talent.abp-tenant-id=1; path=/; SameSite=Lax";
  });
});

test("renders AI learning path recommendations from profile data", async ({ page }) => {
  const apiHits = await setupProfileRoutes(page);

  await page.goto("/app/profile");

  await expect.poll(() => apiHits.getProfileHits()).toBeGreaterThan(0);
  await expect.poll(() => apiHits.getLearningPathHits()).toBeGreaterThan(0);

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
