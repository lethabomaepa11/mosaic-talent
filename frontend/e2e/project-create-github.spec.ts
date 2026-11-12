import { expect, test } from "@playwright/test";
import { jsonOk, waitForWorkspaceReady, mockSafeRepoScan, setupProjectCreation } from "./project-create-fixture";
test.beforeEach(setupProjectCreation);

test("creates a private project with a required problem statement and no GitHub connection", async ({ page }) => {
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

  await expect(page.getByRole("button", { name: "Link a GitHub repository (optional)" })).toBeVisible();
  await page.getByRole("button", { name: "Link a GitHub repository (optional)" }).click();
  await expect(page.getByText("GitHub is optional", { exact: true })).toBeVisible();
  await expect(page.getByText(/create this project without a repository/i)).toBeVisible();
  await expect(page.getByRole("main").getByRole("button", { name: "Create project", exact: true })).toBeEnabled();
  const discoverToggle = page.getByRole("checkbox", { name: /Allow developers to find and join this project/ });
  await expect(discoverToggle).not.toBeChecked();
  await expect(page.getByText("Project type")).toHaveCount(0);
  await expect(page.getByText("Initial status")).toHaveCount(0);
  await expect(page.getByText("Maximum team members")).toHaveCount(0);

  let createPayload: { githubRepo?: string; problemStatement?: string; isPublic?: boolean; maxMembers?: number; type?: string; status?: string } | undefined;
  await page.route("**/api/services/app/BuildJourney/CreateBuild", async (route) => {
    createPayload = route.request().postDataJSON() as { githubRepo?: string };
    await route.fulfill(jsonOk({project:{ id: "project-without-repo", title: "Study Group", githubRepo: null }}));
  });
  await page.getByLabel("Project Title").fill("Study Group");
  await page.getByRole("textbox", { name: "Problem statement" }).fill("Students need one private place to organize their group work.");
  await page.getByLabel("First milestone").fill("One useful prototype someone can try.");
  await page.getByPlaceholder("Describe the solution and what your team will build.").fill("A repo-free project.");
  await page.getByRole("main").getByRole("button", { name: "Create project", exact: true }).click();
  await expect.poll(() => createPayload).toBeDefined();
  expect(createPayload?.githubRepo).toBe("");
  expect(createPayload?.problemStatement).toBe("Students need one private place to organize their group work.");
  expect(createPayload?.isPublic).toBe(false);
  expect(createPayload).not.toHaveProperty("maxMembers");
  expect(createPayload).not.toHaveProperty("type");
  expect(createPayload).not.toHaveProperty("status");

  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
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

  await page.route("**/api/services/app/BuildJourney/CreateBuild", async (route) => {
    createPayload = route.request().postDataJSON() as { githubRepo?: string };
    await route.fulfill(
      jsonOk({project:{
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
      }}),
    );
  });

  await page.goto("/app/projects/create");

  await waitForWorkspaceReady(page);
  await expect(page.getByLabel("Project Title")).toHaveValue("");
  await expect(page.getByPlaceholder("Describe the solution and what your team will build.")).toHaveValue("");
  await page.getByRole("button", { name: "Link a GitHub repository (optional)" }).click();
  await page.getByRole("combobox", { name: /GitHub Repository/ }).fill("octocat/alpha");
  await expect(page.getByText("Repository passed safety checks")).toBeVisible();
  await expect(page.getByLabel("Project Title")).toHaveValue("alpha");
  await page.getByLabel("Project Title").fill("Alpha Delivery");
  await page.getByRole("textbox", { name: "Problem statement" }).fill("Teams need a clear way to coordinate project work.");
  await page.getByLabel("First milestone").fill("One useful prototype someone can try.");
  await page.getByPlaceholder("Describe the solution and what your team will build.").fill("Project created from test");
  await page.getByRole("combobox", { name: /GitHub Repository/ }).fill("octocat/beta");
  await expect(page.getByText("Repository passed safety checks")).toBeVisible();
  await expect(page.getByLabel("Project Title")).toHaveValue("Alpha Delivery");
  await page.getByRole("main").getByRole("button", { name: "Create project", exact: true }).click();

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

  await page.route("**/api/services/app/BuildJourney/CreateBuild", async (route) => {
    createPayload = route.request().postDataJSON() as { githubRepo?: string };
    await route.fulfill(
      jsonOk({project:{
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
      }}),
    );
  });

  await page.goto("/app/projects/create");

  await waitForWorkspaceReady(page);

  await page.getByRole("button", { name: "Link a GitHub repository (optional)" }).click();
  await page.getByRole("button", { name: "Create Repository" }).click();
  await page.getByLabel("Repository Name").fill("new-repo");
  await page.getByRole("dialog", { name: "Create GitHub Repository" }).getByRole("button", { name: "Create Repository" }).click();

  await expect(page.getByLabel("Project Title")).toHaveValue("new-repo");
  await page.getByLabel("Project Title").fill("Repo Build");
  await page.getByRole("textbox", { name: "Problem statement" }).fill("Teams need a clear way to coordinate project work.");
  await page.getByLabel("First milestone").fill("One useful prototype someone can try.");
  await page.getByPlaceholder("Describe the solution and what your team will build.").fill("Project with created repo");
  await expect(page.getByText("Repository passed safety checks")).toBeVisible();
  await page.getByRole("main").getByRole("button", { name: "Create project", exact: true }).click();

  await expect.poll(() => createPayload).toBeDefined();
  expect(createPayload?.githubRepo).toBe("octocat/new-repo");
});


test("the project brief works without opening GitHub or waiting for its API", async ({ page }, testInfo) => {
  let githubRequests = 0;
  let created = false;
  await page.route("**/api/services/app/DeveloperProject/GetGithubConnectionStatus", async (route) => {
    githubRequests++;
    await route.fulfill({ status: 503, body: "{}" });
  });
  await page.route("**/api/services/app/BuildJourney/CreateBuild", async (route) => {
    created = true; await route.fulfill(jsonOk({project:{ id: "new-brief" }}));
  });
  await page.goto("/app/projects/create");
  await waitForWorkspaceReady(page);
  await page.getByLabel("Project Title").fill("Learning together");
  await page.getByLabel("Problem statement").fill("Solo learning lacks team experience.");
  await page.getByLabel("First milestone").fill("One useful prototype someone can try.");
  await page.getByPlaceholder("Describe the solution and what your team will build.").fill("Build a small shared notes app.");
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("main").getByRole("button", { name: "Create project", exact: true })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width !== 768) await page.screenshot({ path: testInfo.outputPath(`project-create-${width}.png`), fullPage: true });
  }
  await page.getByRole("main").getByRole("button", { name: "Create project", exact: true }).click();
  await expect.poll(() => created).toBe(true);
  expect(githubRequests).toBe(0);
});
