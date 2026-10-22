import { expect, test, type Page } from "@playwright/test";

const jsonOk = (body: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({
    result: body,
  }),
});

const setupCoreRoutes = async (page: Page) => {
  await page.route(
    "**/api/services/app/Session/GetCurrentLoginInformations",
    async (route) => {
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
    },
  );

  await page.route("**/api/services/app/DeveloperOnboarding/GetMyProfile", async (route) => {
    await route.fulfill(
      jsonOk({
        userId: 99,
        hasCompletedOnboarding: true,
        githubUsername: "octocat",
        studyLevel: 1,
        teamworkRating: 8,
        skills: [],
        goals: [],
      }),
    );
  });

  await page.route("**/api/services/app/DeveloperProject/GetMyProjects", async (route) => {
    await route.fulfill(jsonOk([]));
  });
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
  await setupCoreRoutes(page);
});

test("scans a selected repository and blocks the form until the result arrives", async ({ page }) => {
  await page.route("**/api/services/app/DeveloperProject/GetGithubConnectionStatus", async (route) => {
    await route.fulfill(jsonOk({ isConnected: true, githubUsername: "octocat" }));
  });
  await page.route("**/api/services/app/DeveloperProject/GetMyGithubRepositories", async (route) => {
    await route.fulfill(jsonOk([{
      name: "alpha", fullName: "octocat/alpha", htmlUrl: "https://github.com/octocat/alpha",
      isPrivate: false, defaultBranch: "main",
    }]));
  });

  await page.route("**/api/services/app/DeveloperProject/ScanRepoSafetyByUrl", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.fulfill(jsonOk({
      progress: [{ step: "Checking cache...", progress: 5 }, { step: "Done!", progress: 100 }],
      result: { repoUrl: "https://github.com/octocat/alpha", riskScore: 12, riskLevel: "low", categories: [], findings: [], badges: [] },
    }));
  });

  await page.goto("/app/projects/create");
  await page.waitForSelector("[data-ai-page='projects-create']", { state: "attached" });
  const createButton = page.getByRole("main").getByRole("button", { name: "Create Project", exact: true });
  await expect(createButton).toBeEnabled();
  await page.getByRole("combobox", { name: /GitHub Repository/ }).fill("octocat/alpha");
  await expect(page.getByText("Running repository safety scan...")).toBeVisible();
  await expect(page.getByText("Repository passed safety checks")).toBeVisible();
  await expect(createButton).toBeEnabled();
});
