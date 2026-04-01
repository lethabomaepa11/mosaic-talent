import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectProvider, useProjectAction } from "..";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));

vi.mock("@/utils/axiosInstance", () => ({
  getAxiosInstance: () => ({
    get: mocks.get,
    post: mocks.post,
    put: mocks.put,
  }),
}));

const Consumer = () => {
  const {
    getGithubConnectionStatus,
    getMyGithubRepositories,
    createGithubRepository,
    leaveProject,
    assignMemberRole,
    scanRepoSafety,
    scanRepoSafetyByGithubUrl,
  } = useProjectAction();

  return (
    <div>
      <button
        onClick={async () => {
          const result = await getGithubConnectionStatus();
          window.__TEST_CONNECTION__ = result;
        }}
        type="button"
      >
        Load Connection
      </button>
      <button
        onClick={async () => {
          const result = await getMyGithubRepositories();
          window.__TEST_REPOS__ = result;
        }}
        type="button"
      >
        Load Repositories
      </button>
      <button
        onClick={async () => {
          const result = await createGithubRepository({
            name: "new-repo",
            description: "desc",
            isPrivate: false,
          });
          window.__TEST_CREATED_REPO__ = result;
        }}
        type="button"
      >
        Create Repository
      </button>
      <button
        onClick={async () => {
          const result = await leaveProject("project-1", "Need to focus on exams");
          window.__TEST_LEAVE_PROJECT__ = result;
        }}
        type="button"
      >
        Leave Project
      </button>
      <button
        onClick={async () => {
          const result = await assignMemberRole("project-1", "member-2", "lead");
          window.__TEST_ASSIGN_ROLE__ = result;
        }}
        type="button"
      >
        Assign Role
      </button>
      <button
        onClick={async () => {
          const result = await scanRepoSafety("project-1");
          window.__TEST_SCAN__ = result;
        }}
        type="button"
      >
        Scan Repo
      </button>
      <button
        onClick={async () => {
          const result = await scanRepoSafetyByGithubUrl(
            "https://github.com/octocat/alpha",
          );
          window.__TEST_SCAN_BY_URL__ = result;
        }}
        type="button"
      >
        Scan Repo By Url
      </button>
    </div>
  );
};

declare global {
  interface Window {
    __TEST_CONNECTION__?: unknown;
    __TEST_REPOS__?: unknown;
    __TEST_CREATED_REPO__?: unknown;
    __TEST_LEAVE_PROJECT__?: unknown;
    __TEST_ASSIGN_ROLE__?: unknown;
    __TEST_SCAN__?: unknown;
    __TEST_SCAN_BY_URL__?: unknown;
  }
}

describe("ProjectProvider GitHub integration", () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.post.mockReset();
    mocks.put.mockReset();
    window.__TEST_CONNECTION__ = undefined;
    window.__TEST_REPOS__ = undefined;
    window.__TEST_CREATED_REPO__ = undefined;
    window.__TEST_LEAVE_PROJECT__ = undefined;
    window.__TEST_ASSIGN_ROLE__ = undefined;
    window.__TEST_SCAN__ = undefined;
    window.__TEST_SCAN_BY_URL__ = undefined;
  });

  afterEach(() => {
    cleanup();
  });

  it("loads GitHub connection status", async () => {
    mocks.get.mockResolvedValueOnce({
      data: {
        result: {
          isConnected: true,
          githubUsername: "octocat",
        },
      },
    });

    render(
      <ProjectProvider>
        <Consumer />
      </ProjectProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Load Connection" }));

    await waitFor(() => {
      expect(window.__TEST_CONNECTION__).toEqual({
        isConnected: true,
        githubUsername: "octocat",
      });
    });
    expect(mocks.get).toHaveBeenCalledWith(
      "/api/services/app/DeveloperProject/GetGithubConnectionStatus",
    );
  });

  it("loads repositories from connected GitHub account", async () => {
    mocks.get.mockResolvedValueOnce({
      data: {
        result: [
          {
            name: "alpha",
            fullName: "octocat/alpha",
            htmlUrl: "https://github.com/octocat/alpha",
            isPrivate: false,
            defaultBranch: "main",
          },
        ],
      },
    });

    render(
      <ProjectProvider>
        <Consumer />
      </ProjectProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Load Repositories" }));

    await waitFor(() => {
      expect(window.__TEST_REPOS__).toEqual([
        {
          name: "alpha",
          fullName: "octocat/alpha",
          htmlUrl: "https://github.com/octocat/alpha",
          isPrivate: false,
          defaultBranch: "main",
        },
      ]);
    });
    expect(mocks.get).toHaveBeenCalledWith(
      "/api/services/app/DeveloperProject/GetMyGithubRepositories",
    );
  });

  it("creates a GitHub repository", async () => {
    mocks.post.mockResolvedValueOnce({
      data: {
        result: {
          name: "new-repo",
          fullName: "octocat/new-repo",
          htmlUrl: "https://github.com/octocat/new-repo",
          isPrivate: false,
          defaultBranch: "main",
        },
      },
    });

    render(
      <ProjectProvider>
        <Consumer />
      </ProjectProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create Repository" }));

    await waitFor(() => {
      expect(window.__TEST_CREATED_REPO__).toEqual({
        name: "new-repo",
        fullName: "octocat/new-repo",
        htmlUrl: "https://github.com/octocat/new-repo",
        isPrivate: false,
        defaultBranch: "main",
      });
    });
    expect(mocks.post).toHaveBeenCalledWith(
      "/api/services/app/DeveloperProject/CreateGithubRepository",
      {
        description: "desc",
        isPrivate: false,
        name: "new-repo",
      },
    );
  });

  it("scans repo safety for a project", async () => {
    mocks.post.mockResolvedValueOnce({
      data: {
        result: {
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
        },
      },
    });

    render(
      <ProjectProvider>
        <Consumer />
      </ProjectProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Scan Repo" }));

    await waitFor(() => {
      expect(window.__TEST_SCAN__).toEqual({
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
          scannedAt: "",
          commitSha: "",
          filesScanned: undefined,
          totalRepoFiles: undefined,
          cached: undefined,
          meta: undefined,
        },
      });
    });

    expect(mocks.post).toHaveBeenCalledWith(
      "/api/services/app/DeveloperProject/ScanRepoSafety",
      {
        projectId: "project-1",
      },
    );
  });

  it("leaves a project with a reason", async () => {
    mocks.post.mockResolvedValueOnce({
      data: {
        result: {
          id: "project-1",
          title: "Alpha",
          description: "Desc",
          maxMembers: 4,
          githubRepo: "",
          skills: [],
          type: "group",
          status: "open",
          ownerId: "owner-2",
          createdAt: "2026-04-01T00:00:00Z",
          members: [],
          tasks: [],
        },
      },
    });
    mocks.get.mockResolvedValue({
      data: { result: [] },
    });

    render(
      <ProjectProvider>
        <Consumer />
      </ProjectProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Leave Project" }));

    await waitFor(() => {
      expect(window.__TEST_LEAVE_PROJECT__).toMatchObject({
        id: "project-1",
        ownerId: "owner-2",
      });
    });

    expect(mocks.post).toHaveBeenCalledWith(
      "/api/services/app/DeveloperProject/LeaveProject",
      {
        projectId: "project-1",
        reason: "Need to focus on exams",
      },
    );
  });

  it("assigns a new member role", async () => {
    mocks.put.mockResolvedValueOnce({
      data: {
        result: {
          id: "project-1",
          title: "Alpha",
          description: "Desc",
          maxMembers: 4,
          githubRepo: "",
          skills: [],
          type: "group",
          status: "open",
          ownerId: "owner-1",
          createdAt: "2026-04-01T00:00:00Z",
          members: [
            {
              id: "member-2",
              name: "Member Two",
              role: "lead",
              avatar: "",
            },
          ],
          tasks: [],
        },
      },
    });
    mocks.get.mockResolvedValue({
      data: { result: [] },
    });

    render(
      <ProjectProvider>
        <Consumer />
      </ProjectProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Assign Role" }));

    await waitFor(() => {
      expect(window.__TEST_ASSIGN_ROLE__).toMatchObject({
        id: "project-1",
      });
    });

    expect(mocks.put).toHaveBeenCalledWith(
      "/api/services/app/DeveloperProject/AssignMemberRole",
      {
        projectId: "project-1",
        memberId: "member-2",
        role: "lead",
      },
    );
  });

  it("scans repo safety by github url", async () => {
    mocks.post.mockResolvedValueOnce({
      data: {
        result: {
          progress: [{ step: "Done!", progress: 100 }],
          result: {
            repoUrl: "https://github.com/octocat/alpha",
            riskScore: 8,
            riskLevel: "low",
            categories: [],
            findings: [],
            badges: [],
          },
        },
      },
    });

    render(
      <ProjectProvider>
        <Consumer />
      </ProjectProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Scan Repo By Url" }));

    await waitFor(() => {
      expect(window.__TEST_SCAN_BY_URL__).toEqual({
        progress: [{ step: "Done!", progress: 100 }],
        result: {
          repoUrl: "https://github.com/octocat/alpha",
          riskScore: 8,
          riskLevel: "low",
          categories: [],
          findings: [],
          badges: [],
          scannedAt: "",
          commitSha: "",
          filesScanned: undefined,
          totalRepoFiles: undefined,
          cached: undefined,
          meta: undefined,
        },
      });
    });

    expect(mocks.post).toHaveBeenCalledWith(
      "/api/services/app/DeveloperProject/ScanRepoSafetyByUrl",
      {
        githubUrl: "https://github.com/octocat/alpha",
      },
    );
  });
});
