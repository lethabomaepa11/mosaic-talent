import type {Page} from "@playwright/test";
import {jsonOk,setupProjectCreation} from "./project-create-fixture";
export const teamBuilds=[
  {project:{id:"react-project",title:"React Dashboard",description:"Build a data dashboard",problemStatement:"Community clinics cannot compare local health trends.",isPublic:true,estimatedHoursPerWeek:4,difficulty:"beginner",skills:["React","TypeScript"],status:"open",members:[],tasks:[]},purpose:0,firstOutcome:"One useful chart",teamTimeZone:"Africa/Johannesburg",taskDetails:[]},
  {project:{id:"python-project",title:"Python API",description:"Design a service API",problemStatement:"Student teams struggle to share reliable study data.",isPublic:true,estimatedHoursPerWeek:10,difficulty:"advanced",skills:["Python"],status:"open",members:[],tasks:[]},purpose:2,firstOutcome:"A working endpoint",teamTimeZone:"UTC",taskDetails:[]},
];
export const setupBuildJourney=async(page:Page)=>{
  await setupProjectCreation({page});
  await page.route("**/api/services/app/BuildJourney/GetMyInvitations",route=>route.fulfill(jsonOk([])));
  const profile={userId:99,hasCompletedOnboarding:true,githubUsername:"",studyLevel:1,skills:["React"],goals:[],weeklyHours:4,collaborationIntent:0,timeZone:"Africa/Johannesburg"};
  await page.route("**/api/services/app/BuildJourney/GetHome",route=>route.fulfill(jsonOk({profile,developerId:"dev-99",myProjects:[],openProjects:teamBuilds})));
};
