export interface ProjectListItem {
  status: string;
}

export const isCompletedProject = (project: ProjectListItem) =>
  ["complete", "completed"].includes(project.status.trim().toLowerCase());

export const splitProjectsByStatus = <T extends ProjectListItem>(projects: T[]) => ({
  active: projects.filter((project) => !isCompletedProject(project)),
  completed: projects.filter(isCompletedProject),
});
