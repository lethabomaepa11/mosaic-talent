import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BuildProvider, useBuildActions, useBuildState } from "..";
import { normalizeBuild } from "../normalizers";
const api=vi.hoisted(()=>({get:vi.fn(),post:vi.fn()}));
vi.mock("@/utils/axiosInstance",()=>({getAxiosInstance:()=>api}));
const envelope={project:{id:"build-1",title:"A useful thing",skills:[],tasks:[{id:"task-1",title:"First task",status:"todo"}],members:[]},purpose:2,firstOutcome:"A usable prototype",taskDetails:[{id:"task-1",isStarterTask:true,acceptanceCriteria:"A person can try it"}]};
const ok=(result:unknown)=>({data:{result}});
const setup=()=>renderHook(()=>({actions:useBuildActions(),state:useBuildState()}),{wrapper:BuildProvider});
beforeEach(()=>{vi.resetAllMocks();api.get.mockResolvedValue(ok(envelope));api.post.mockResolvedValue(ok(envelope));});
afterEach(cleanup);
describe("Build journey provider",()=>{
  it("loads profile, private memberships, and open teams through one provider action",async()=>{
    api.get.mockResolvedValue(ok({profile:{skills:["React"],goals:[],weeklyHours:4},developerId:"dev-1",myProjects:[envelope],openProjects:[]}));
    const {result}=setup();await act(()=>result.current.actions.loadHome());
    expect(result.current.state).toMatchObject({isPending:false,developerId:"dev-1",profile:{weeklyHours:4},mine:[{id:"build-1",purpose:2}],teams:[]});
  });
  it("enriches tasks without inventing details on legacy tasks",()=>{
    const build=normalizeBuild(envelope as unknown as Parameters<typeof normalizeBuild>[0]);
    expect(build.tasks[0]).toMatchObject({isStarterTask:true,acceptanceCriteria:"A person can try it"});
    expect(normalizeBuild({project:{...envelope.project,tasks:undefined}} as unknown as Parameters<typeof normalizeBuild>[0]).tasks).toEqual([]);
  });
  it("loads a build and preserves it after a failed refresh",async()=>{
    const {result}=setup();await act(()=>result.current.actions.loadBuild("build-1"));api.get.mockRejectedValue(new Error("offline"));
    await act(async()=>{await expect(result.current.actions.loadBuild("build-1")).rejects.toThrow("offline");});
    expect(result.current.state).toMatchObject({selected:{id:"build-1"},error:"offline",isPending:false});
  });
  it("loads the current developer’s contribution history",async()=>{
    api.get.mockResolvedValue(ok([{id:"entry-1",reviewCount:2}]));const {result}=setup();await act(()=>result.current.actions.loadContributions());
    expect(result.current.state.contributions).toEqual([{id:"entry-1",reviewCount:2}]);
  });
  const commands=[
    ["createBuild","CreateBuild",{title:"Build",purpose:2}],
    ["createTask","CreateTask",{projectId:"build-1",title:"Task",isStarterTask:true}],
    ["claimTask","ClaimTask",{projectId:"build-1",taskId:"task-1"}],
    ["setTaskStatus","SetTaskStatus",{projectId:"build-1",taskId:"task-1",status:"done"}],
  ] as const;
  it.each(commands)("handles %s success and failure without losing the build",async(name,endpoint,input)=>{
    const {result}=setup();
    const invoke=()=>name==="createBuild"?result.current.actions.createBuild(input as Parameters<typeof result.current.actions.createBuild>[0]):name==="createTask"?result.current.actions.createTask(input as Parameters<typeof result.current.actions.createTask>[0]):name==="claimTask"?result.current.actions.claimTask("build-1","task-1"):result.current.actions.setTaskStatus("build-1","task-1","done");
    await act(async()=>{await invoke();});expect(api.post).toHaveBeenCalledWith(`/api/services/app/BuildJourney/${endpoint}`,input);expect(result.current.state.selected?.id).toBe("build-1");
    api.post.mockRejectedValue(new Error("not saved"));await act(async()=>{await expect(invoke()).rejects.toThrow("not saved");});expect(result.current.state.selected?.id).toBe("build-1");
  });
  it("shows the real workload warning before joining and sends explicit consent",async()=>{
    api.get.mockResolvedValueOnce(ok({shouldWarn:true,message:"You have other commitments"})).mockResolvedValue(ok(envelope));
    const {result}=setup();await act(async()=>{expect((await result.current.actions.joinBuild("build-1"))?.shouldWarn).toBe(true);});expect(api.post).not.toHaveBeenCalled();
    await act(()=>result.current.actions.joinBuild("build-1",true));expect(api.post).toHaveBeenCalledWith("/api/services/app/DeveloperProject/JoinProject",{projectId:"build-1",confirmHighWorkload:true});
  });
  it("joins without a workload warning and propagates denied joins",async()=>{
    api.get.mockResolvedValueOnce(ok({shouldWarn:false})).mockResolvedValue(ok(envelope));const {result}=setup();await act(()=>result.current.actions.joinBuild("build-1"));
    expect(result.current.state.selected?.id).toBe("build-1");api.post.mockRejectedValue(new Error("full"));await act(async()=>{await expect(result.current.actions.joinBuild("build-1",true)).rejects.toThrow("full");});
  });
  it("accepts invitations explicitly and handles refusal",async()=>{
    const {result}=setup();await act(()=>result.current.actions.acceptInvite("build-1","invite-1"));expect(api.post).toHaveBeenCalledWith("/api/services/app/DeveloperProject/AcceptProjectInvite",{projectId:"build-1",inviteId:"invite-1"});
    api.post.mockRejectedValue(new Error("expired"));await act(async()=>{await expect(result.current.actions.acceptInvite("build-1","invite-1")).rejects.toThrow("expired");});
  });
});
