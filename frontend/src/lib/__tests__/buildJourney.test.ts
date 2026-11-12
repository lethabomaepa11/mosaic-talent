import {describe,expect,it} from "vitest";
import {complete,fitReasons,purposeLabel} from "../buildJourney";
import type {BuildProject} from "@/providers/build-provider/context";
import type {IDeveloperProfile} from "@/providers/developer-provider/context";
const project={skills:["React"],purpose:2,estimatedHoursPerWeek:4,teamTimeZone:"Africa/Johannesburg"} as BuildProject;
describe("explained team fit",()=>{
  it("makes no fit claims without preferences",()=>expect(fitReasons(project)).toEqual([]));
  it("explains shared skills, realistic availability, and exact time zone only",()=>{
    const profile:IDeveloperProfile={githubUsername:"",studyLevel:0,skills:["react"],goals:[],weeklyHours:6,timeZone:"Africa/Johannesburg",collaborationIntent:2};
    expect(fitReasons(project,profile)).toEqual(["Practice React","Fits your 6h weekly availability","Same time zone"]);
    expect(fitReasons(project,{...profile,skills:[],weeklyHours:2,timeZone:"UTC",collaborationIntent:0})).toEqual([]);
  });
  it("recognizes finished legacy projects and unknown purposes",()=>{
    expect(complete("Complete")).toBe(true);expect(complete("completed")).toBe(true);expect(complete("open")).toBe(false);expect(purposeLabel(9)).toBe("Learn with a team");
  });
});
