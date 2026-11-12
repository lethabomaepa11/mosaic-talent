import type { IDeveloperProfile } from "@/providers/developer-provider/context";
import type { BuildProject } from "@/providers/build-provider/context";
export const PURPOSES = ["Learn with a team", "Build a product", "Explore a cofounder"];
export const complete = (status: string) => ["complete", "completed"].includes(status.toLowerCase());
export const purposeLabel = (purpose: number) => PURPOSES[purpose] ?? PURPOSES[0];
export const fitReasons = (project: BuildProject, profile?: IDeveloperProfile): string[] => {
  if (!profile) return [];
  const known = new Set([...profile.skills, ...profile.goals].map((skill) => skill.toLowerCase()));
  const shared = project.skills.filter((skill) => known.has(skill.toLowerCase())).slice(0, 2);
  return [
    shared.length ? `Practice ${shared.join(" and ")}` : "",
    profile.weeklyHours && project.estimatedHoursPerWeek <= profile.weeklyHours ? `Fits your ${profile.weeklyHours}h weekly availability` : "",
    profile.timeZone && project.teamTimeZone === profile.timeZone ? "Same time zone" : "",
    profile.collaborationIntent === project.purpose ? "Matches what you want to build toward" : "",
  ].filter(Boolean).slice(0, 3);
};
