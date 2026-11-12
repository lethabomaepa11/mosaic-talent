import {expect,test} from "@playwright/test";
import {randomUUID} from "node:crypto";
const api=process.env.LOCAL_LIVE_API_URL??"";
test.skip(!api,"Requires the isolated local PostgreSQL-backed API.");
test("real build creation, collaboration preferences, atomic task claims, and contribution evidence",async({page,request},testInfo)=>{
  test.setTimeout(180_000);
  expect(["localhost","127.0.0.1"]).toContain(new URL(api).hostname);
  const suffix=randomUUID().slice(0,8);
  const password=`Local!${suffix}Aa123`;
  const actors=[];
  for(const name of ["Builder","Teammate","Observer"]){
    const email=`${name.toLowerCase()}-${suffix}@example.invalid`;
    const registered=await request.post(`${api}/api/services/app/Account/Register`,{headers:{"Abp-TenantId":"1"},data:{fullName:`${name} Local`,emailAddress:email,password}});expect(registered.ok()).toBe(true);
    const login=await request.post(`${api}/api/TokenAuth/Authenticate`,{headers:{"Abp-TenantId":"1"},data:{userNameOrEmailAddress:email,password}});expect(login.ok()).toBe(true);
    const token=(await login.json()).result.accessToken;
    const headers={"Abp-TenantId":"1",Authorization:`Bearer ${token}`};
    const profile=await request.post(`${api}/api/services/app/DeveloperOnboarding/UpsertMyProfile`,{headers,data:{skills:["TypeScript"],goals:[],studyLevel:1,completeOnboarding:true,collaborationIntent:2,weeklyHours:4,timeZone:"Africa/Johannesburg"}});expect(profile.ok()).toBe(true);
    actors.push({headers,token});
  }
  const [owner,teammate,observer]=actors;
  await page.context().addCookies([{name:"mosaic-talent.access-token",value:owner.token,url:"http://127.0.0.1:3000"},{name:"mosaic-talent.abp-tenant-id",value:"1",url:"http://127.0.0.1:3000"}]);
  await page.goto("/app");await expect(page.getByRole("heading",{name:"Home",exact:true})).toBeVisible();
  await page.goto("/app/projects/create");
  const title=`Shared learning ${suffix}`;
  await page.getByLabel("Project Title").fill(title);
  await page.getByLabel("Problem statement").fill("Developers need a practical way to learn collaboration.");
  await page.getByLabel("Description").fill("Build a shared notebook for developer teams.");
  await page.getByLabel("First milestone").fill("A working note editor that a teammate can try.");
  await page.getByLabel("Project goal").click();await page.getByRole("option",{name:"Explore a cofounder",exact:true}).click();
  await page.getByRole("checkbox",{name:/Allow developers to find and join this project/}).check();
  await page.getByRole("button",{name:"Create project",exact:true}).click();
  await expect(page).toHaveURL(/\/app\/build\/[\w-]+$/);await expect(page.getByRole("heading",{name:title,exact:true})).toBeVisible();
  const projectId=new URL(page.url()).pathname.split("/").pop()!;
  const endpoint=`${api}/api/services/app/BuildJourney`;
  const privateBuild=await request.post(`${endpoint}/CreateBuild`,{headers:owner.headers,data:{title:"Private planning",problemStatement:"Keep this work private",description:"A private team workspace",isPublic:false,difficulty:1,estimatedHoursPerWeek:2,skills:[],purpose:0,firstOutcome:"A first draft"}});expect(privateBuild.ok()).toBe(true);
  const privateId=(await privateBuild.json()).result.project.id;
  const privateRead=await request.get(`${endpoint}/GetBuild`,{headers:observer.headers,params:{projectId:privateId}});expect(privateRead.ok()).toBe(false);
  const taskPayload={projectId,title:"Build the editor",description:"Start with the notes page",isStarterTask:true,acceptanceCriteria:"A teammate can save and reopen a note"};
  const denied=await request.post(`${endpoint}/CreateTask`,{headers:observer.headers,data:taskPayload});expect(denied.ok()).toBe(false);
  await page.getByRole("tab",{name:"Tasks",exact:true}).click();await page.getByRole("button",{name:"Add task"}).click();
  await page.getByLabel("Task title").fill(taskPayload.title);await page.getByLabel("Acceptance criteria").fill(taskPayload.acceptanceCriteria);await page.getByRole("dialog",{name:"New task",exact:true}).getByRole("button",{name:"Add task",exact:true}).click();
  await expect(page.getByRole("heading",{name:taskPayload.title,exact:true})).toBeVisible();
  const build=await request.get(`${endpoint}/GetBuild`,{headers:owner.headers,params:{projectId}});const data=(await build.json()).result;
  expect(data.firstOutcome).toBe("A working note editor that a teammate can try.");expect(data.purpose).toBe(2);expect(data.taskDetails[0].isStarterTask).toBe(true);
  const taskId=data.project.tasks[0].id;
  const joined=await request.post(`${api}/api/services/app/DeveloperProject/JoinProject`,{headers:teammate.headers,data:{projectId,confirmHighWorkload:true}});expect(joined.ok()).toBe(true);
  const claims=await Promise.all([owner,teammate].map(actor=>request.post(`${endpoint}/ClaimTask`,{headers:actor.headers,data:{projectId,taskId}})));expect(claims.filter(response=>response.ok())).toHaveLength(1);
  const winner=claims[0].ok()?owner:teammate;const loser=claims[0].ok()?teammate:owner;
  const observerJoined=await request.post(`${api}/api/services/app/DeveloperProject/JoinProject`,{headers:observer.headers,data:{projectId,confirmHighWorkload:true}});expect(observerJoined.ok()).toBe(true);
  const wrongStatus=await request.post(`${endpoint}/SetTaskStatus`,{headers:observer.headers,data:{projectId,taskId,status:"done"}});expect(wrongStatus.ok()).toBe(false);
  const claimed=await request.get(`${endpoint}/GetBuild`,{headers:winner.headers,params:{projectId}});expect((await claimed.json()).result.project.tasks[0].assignedMemberId).toBe((await claimed.json()).result.currentDeveloperId);
  const done=await request.post(`${endpoint}/SetTaskStatus`,{headers:winner.headers,data:{projectId,taskId,status:"done"}});expect(done.ok()).toBe(true);
  const evidence=await request.post(`${api}/api/services/app/ProjectProgress/CreateProjectProgressEntry`,{headers:winner.headers,data:{projectId,title:"Notebook editor delivered",summary:"A teammate can now save and reopen their learning notes.",evidenceUrl:"https://github.com/example/notebook/pull/1",selfReview:"I learned to keep the first outcome small enough to review."}});expect(evidence.ok()).toBe(true);
  const contributions=await request.get(`${endpoint}/GetMyContributions`,{headers:winner.headers});expect((await contributions.json()).result.some((entry:{projectId:string})=>entry.projectId===projectId)).toBe(true);
  const otherContributions=await request.get(`${endpoint}/GetMyContributions`,{headers:loser.headers});expect((await otherContributions.json()).result.some((entry:{projectId:string})=>entry.projectId===projectId)).toBe(false);
  const legacySave=await request.post(`${api}/api/services/app/DeveloperOnboarding/UpsertMyProfile`,{headers:owner.headers,data:{skills:["TypeScript"],goals:[],studyLevel:1}});expect(legacySave.ok()).toBe(true);expect((await legacySave.json()).result).toMatchObject({collaborationIntent:2,weeklyHours:4,timeZone:"Africa/Johannesburg"});
  for(const path of ["/", "/app", "/app/projects/open",`/app/build/${projectId}`,`/app/build/${projectId}?tab=board`,"/app/work","/app/build-profile","/app/ideator"]){
    await page.goto(path);await page.waitForLoadState("networkidle");
    for(const width of [360,768,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${path} at ${width}`).toBe(true);if(width!==768)await page.screenshot({path:testInfo.outputPath(`${path.replace(/[^a-z0-9]/gi,"-")||"landing"}-${width}.png`),fullPage:true});}
  }
  await page.context().addCookies([{name:"mosaic-talent.access-token",value:winner.token,url:"http://127.0.0.1:3000"}]);
  await page.goto("/app/work");await page.getByRole("tab",{name:"Contributions",exact:true}).click();await expect(page.getByRole("heading",{name:"Notebook editor delivered"})).toBeVisible();
  await page.goto("/app/build-profile");await page.getByLabel("Hours available per week").fill("6");await page.getByRole("button",{name:"Save preferences"}).click();await expect(page.getByText("Preferences saved",{exact:true})).toBeVisible();await page.reload();await expect(page.getByLabel("Hours available per week")).toHaveValue("6");
  for(const actor of [teammate,observer]){const left=await request.post(`${api}/api/services/app/DeveloperProject/LeaveProject`,{headers:actor.headers,data:{projectId,reason:"Local automated collaboration check completed."}});expect(left.ok()).toBe(true);}
  for(const id of [projectId,privateId]){const removed=await request.delete(`${api}/api/services/app/DeveloperProject/DeleteProject`,{headers:owner.headers,params:{projectId:id}});expect(removed.ok()).toBe(true);}
});
