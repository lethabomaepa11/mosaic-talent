import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ProjectCard } from "../ProjectCard";
import type { IProject } from "@/providers/project-provider/context";

const projectFixture: IProject = {
  id: "project-1",
  title: "Alpha Platform",
  description: "Build an internal collaboration dashboard.",
  maxMembers: 5,
  difficulty: "intermediate",
  estimatedHoursPerWeek: 10,
  workloadScore: 120,
  githubRepo: "https://github.com/octocat/alpha",
  skills: ["React", "TypeScript"],
  type: "group",
  status: "open",
  ownerId: "owner-1",
  createdAt: "2026-04-02T00:00:00Z",
  members: [],
  tasks: [],
};

describe("ProjectCard", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("shows View Project button when actions are hidden", () => {
    render(<ProjectCard project={projectFixture} hideActions variant="swipe" />);

    expect(screen.getByRole("button", { name: /view project/i })).toBeInTheDocument();
  });
});
