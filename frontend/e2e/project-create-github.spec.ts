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

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.cookie = "mosaic-talent.access-token=e2e-token; path=/; SameSite=Lax";
    document.cookie = "mosaic-talent.abp-tenant-id=1; path=/; SameSite=Lax";
  });
  await setupCoreRoutes(page);
});

test("shows GitHub connect gate before project creation when not connected", async ({ page }) => {
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

  await page.goto("/app/projects/my?create=true");

  await expect(page.getByText("Connect GitHub to create a project.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create Project" })).toBeDisabled();
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

  await page.goto("/app/projects/my?create=true");

  await page.getByLabel("Project Title").fill("Alpha Delivery");
  await page.getByLabel("Description").fill("Project created from test");
  await page.locator("[data-ai-field='project-github-repo'] input").fill("octocat/beta");
  await page.getByText("octocat/beta (private)").click();
  await page.getByRole("button", { name: "Create Project" }).click();

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

  await page.goto("/app/projects/my?create=true");

  await page.getByRole("button", { name: "Create Repository" }).click();
  await page.getByLabel("Repository Name").fill("new-repo");
  await page
    .locator(".ant-modal-content")
    .getByRole("button", { name: "Create Repository" })
    .click();

  await page.getByLabel("Project Title").fill("Repo Build");
  await page.getByLabel("Description").fill("Project with created repo");
  await page.getByRole("button", { name: "Create Project" }).click();

  await expect.poll(() => createPayload).toBeDefined();
  expect(createPayload?.githubRepo).toBe("octocat/new-repo");
});
