import { IProject } from "@/providers/project-provider/context";

export type ProjectDetailViewState = "loading" | "ready" | "not-found";

interface ResolveProjectDetailViewStateInput {
  isProjectLoading: boolean;
  projectId?: string;
  project?: IProject;
}

export const resolveProjectDetailViewState = ({
  isProjectLoading,
  projectId,
  project,
}: ResolveProjectDetailViewStateInput): ProjectDetailViewState => {
  if (isProjectLoading) {
    return "loading";
  }

  if (!projectId) {
    return "not-found";
  }

  if (!project || project.id !== projectId) {
    return "not-found";
  }

  return "ready";
};
