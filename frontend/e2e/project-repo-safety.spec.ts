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
        userId: 99, hasCompletedOnboarding: true,
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

const waitForWorkspaceReady = async (page: Page) => {
  const guard = page.locator("[data-ai-guard-loading='developer']");
  if (await guard.count()) {
    await guard.waitFor({ state: "detached" });
  }
  await page.waitForSelector("[data-ai-page='projects-open']", { state: "attached" });
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

test("scans repo safety from open projects", async ({ page }) => {
  await page.route("**/api/services/app/DeveloperProject/GetOpenProjects", async (route) => {
    await route.fulfill(
      jsonOk([
        {
          id: "project-1",
          title: "Repo Shield",
          description: "Check repo safety",
          maxMembers: 4,
          githubRepo: "https://github.com/octocat/alpha",
          skills: ["C#"],
          type: "group",
          status: "open",
          ownerId: "owner-1",
          createdAt: "2026-03-30T00:00:00.000Z",
          members: [],
          tasks: [],
        },
      ]),
    );
  });

  await page.route("**/api/services/app/DeveloperProject/ScanRepoSafety", async (route) => {
    await route.fulfill(
      jsonOk({
        progress: [
          { step: "Checking cache...", progress: 5 },
          { step: "Done!", progress: 100 },
        ],
        result: {
          repoUrl: "https://github.com/octocat/alpha",
          riskScore: 12,
          riskLevel: "low",
          categories: [],
          findings: [],
          badges: [],
        },
      }),
    );
  });

  await page.goto("/app/projects/open");

  await waitForWorkspaceReady(page);
  await page.getByText("Repo Shield").waitFor();
  await page.getByRole("button", { name: "Check Repo Safety" }).click();
  await expect(page.getByText("Safe")).toBeVisible();
});
