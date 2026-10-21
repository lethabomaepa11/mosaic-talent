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

  await page.route("**/api/services/app/DeveloperProject/GetOpenProjects", async (route) => {
    await route.fulfill(jsonOk([]));
  });
};

const waitForWorkspaceReady = async (page: Page) => {
  const guard = page.locator("[data-ai-guard-loading='developer']");
  if (await guard.count()) {
    await guard.waitFor({ state: "detached" });
  }
  await page.waitForSelector("[data-ai-page='projects-create']", { state: "attached" });
};

const mockSafeRepoScan = async (page: Page) => {
  await page.route("**/api/services/app/DeveloperProject/ScanRepoSafetyByUrl", async (route) => {
    await route.fulfill(jsonOk({
      progress: [{ step: "Complete", progress: 100 }],
      result: { repoUrl: "https://github.com/octocat/alpha", riskScore: 0, riskLevel: "low", categories: [], findings: [], badges: [] },
    }));
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

test("allows project creation without connecting GitHub", async ({ page }) => {
  await page.route(
    "**/api/services/app/DeveloperProject/GetGithubConnectionStatus",
    async (route) => {
      await route.fulfill(
        jsonOk({
          isConnected: false,
          githubUsername: "",
        }),
      );
    },
  );

  await page.goto("/app/projects/create");

  await waitForWorkspaceReady(page);

  await expect(page.getByText("Connect GitHub to create a project.")).toBeVisible();
  await expect(page.getByText(/create this project without a repository/i)).toBeVisible();
  await expect(page.getByRole("main").getByRole("button", { name: "Create Project", exact: true })).toBeEnabled();

  let createPayload: { githubRepo?: string } | undefined;
  await page.route("**/api/services/app/DeveloperProject/CreateProject", async (route) => {
    createPayload = route.request().postDataJSON() as { githubRepo?: string };
    await route.fulfill(jsonOk({ id: "project-without-repo", title: "Study Group", githubRepo: null }));
  });
  await page.getByLabel("Project Title").fill("Study Group");
  await page.getByPlaceholder("Write markdown specs for your team.").fill("A repo-free project.");
  await page.getByRole("main").getByRole("button", { name: "Create Project", exact: true }).click();
  await expect.poll(() => createPayload).toBeDefined();
  expect(createPayload?.githubRepo).toBe("");
});

test("creates project using selected GitHub repository", async ({ page }) => {
  let createPayload: { githubRepo?: string } | undefined;

  await page.route(
    "**/api/services/app/DeveloperProject/GetGithubConnectionStatus",
    async (route) => {
      await route.fulfill(
        jsonOk({
          isConnected: true,
          githubUsername: "octocat",
        }),
      );
    },
  );
  await mockSafeRepoScan(page);

  await page.route(
    "**/api/services/app/DeveloperProject/GetMyGithubRepositories",
    async (route) => {
      await route.fulfill(
        jsonOk([
          {
            name: "alpha",
            fullName: "octocat/alpha",
            htmlUrl: "https://github.com/octocat/alpha",
            isPrivate: false,
            defaultBranch: "main",
          },
          {
            name: "beta",
            fullName: "octocat/beta",
            htmlUrl: "https://github.com/octocat/beta",
            isPrivate: true,
            defaultBranch: "main",
          },
        ]),
      );
    },
  );

  await page.route("**/api/services/app/DeveloperProject/CreateProject", async (route) => {
    createPayload = route.request().postDataJSON() as { githubRepo?: string };
    await route.fulfill(
      jsonOk({
        id: "8b0f8a16-9b4c-4f4e-b931-e7c4640cb5d3",
        title: "Alpha Delivery",
        description: "Project created from test",
        maxMembers: 4,
        githubRepo: "https://github.com/octocat/beta",
        skills: ["React"],
        type: "group",
        status: "open",
        ownerId: "owner-1",
        createdAt: "2026-03-30T00:00:00.000Z",
        members: [],
        tasks: [],
      }),
    );
  });

  await page.goto("/app/projects/create");

  await waitForWorkspaceReady(page);
  await expect(page.getByLabel("Project Title")).toHaveValue("");
  await expect(page.getByPlaceholder("Write markdown specs for your team.")).toHaveValue("");
  await page.getByRole("combobox", { name: /GitHub Repository/ }).fill("octocat/alpha");
  await expect(page.getByText("Repository passed safety checks")).toBeVisible();
  await expect(page.getByLabel("Project Title")).toHaveValue("alpha");
  await page.getByLabel("Project Title").fill("Alpha Delivery");
  await page.getByPlaceholder("Write markdown specs for your team.").fill("Project created from test");
  await page.getByRole("combobox", { name: /GitHub Repository/ }).fill("octocat/beta");
  await expect(page.getByText("Repository passed safety checks")).toBeVisible();
  await expect(page.getByLabel("Project Title")).toHaveValue("Alpha Delivery");
  await page.getByRole("main").getByRole("button", { name: "Create Project", exact: true }).click();

  await expect.poll(() => createPayload).toBeDefined();
  expect(createPayload?.githubRepo).toBe("octocat/beta");
});

test("creates a new GitHub repository and auto-selects it for project creation", async ({ page }) => {
  let repoFetchCount = 0;
  let createPayload: { githubRepo?: string } | undefined;

  await page.route(
    "**/api/services/app/DeveloperProject/GetGithubConnectionStatus",
    async (route) => {
      await route.fulfill(
        jsonOk({
          isConnected: true,
          githubUsername: "octocat",
        }),
      );
    },
  );

  await mockSafeRepoScan(page);

  await page.route(
    "**/api/services/app/DeveloperProject/GetMyGithubRepositories",
    async (route) => {
      repoFetchCount += 1;
      const repos =
        repoFetchCount >= 2
          ? [
              {
                name: "new-repo",
                fullName: "octocat/new-repo",
                htmlUrl: "https://github.com/octocat/new-repo",
                isPrivate: false,
                defaultBranch: "main",
              },
            ]
          : [];
      await route.fulfill(jsonOk(repos));
    },
  );

  await page.route(
    "**/api/services/app/DeveloperProject/CreateGithubRepository",
    async (route) => {
      await route.fulfill(
        jsonOk({
          name: "new-repo",
          fullName: "octocat/new-repo",
          htmlUrl: "https://github.com/octocat/new-repo",
          isPrivate: false,
          defaultBranch: "main",
        }),
      );
    },
  );

  await page.route("**/api/services/app/DeveloperProject/CreateProject", async (route) => {
    createPayload = route.request().postDataJSON() as { githubRepo?: string };
    await route.fulfill(
      jsonOk({
        id: "8b0f8a16-9b4c-4f4e-b931-e7c4640cb5d4",
        title: "Repo Build",
        description: "Project with created repo",
        maxMembers: 4,
        githubRepo: "https://github.com/octocat/new-repo",
        skills: [],
        type: "group",
        status: "open",
        ownerId: "owner-1",
        createdAt: "2026-03-30T00:00:00.000Z",
        members: [],
        tasks: [],
      }),
    );
  });

  await page.goto("/app/projects/create");

  await waitForWorkspaceReady(page);

  await page.getByRole("button", { name: "Create Repository" }).click();
  await page.getByLabel("Repository Name").fill("new-repo");
  await page.getByRole("dialog", { name: "Create GitHub Repository" }).getByRole("button", { name: "Create Repository" }).click();

  await expect(page.getByLabel("Project Title")).toHaveValue("new-repo");
  await page.getByLabel("Project Title").fill("Repo Build");
  await page.getByPlaceholder("Write markdown specs for your team.").fill("Project with created repo");
  await expect(page.getByText("Repository passed safety checks")).toBeVisible();
  await page.getByRole("main").getByRole("button", { name: "Create Project", exact: true }).click();

  await expect.poll(() => createPayload).toBeDefined();
  expect(createPayload?.githubRepo).toBe("octocat/new-repo");
});
