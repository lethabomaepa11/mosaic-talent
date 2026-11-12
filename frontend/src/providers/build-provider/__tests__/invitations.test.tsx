import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BuildProvider, useBuildActions, useBuildState } from "..";
const api=vi.hoisted(()=>({get:vi.fn(),post:vi.fn()}));
vi.mock("@/utils/axiosInstance",()=>({getAxiosInstance:()=>api}));
const setup=()=>renderHook(()=>({actions:useBuildActions(),state:useBuildState()}),{wrapper:BuildProvider});
beforeEach(()=>vi.resetAllMocks());
afterEach(cleanup);
describe("project invitations",()=>{
  it("does not erase an unrelated Home failure when the inbox loads",async()=>{
    const {result}=setup();api.get.mockRejectedValueOnce(new Error("Home offline"));
    await act(async()=>{await expect(result.current.actions.loadHome()).rejects.toThrow("Home offline");});
    api.get.mockResolvedValue({data:{result:[]}});await act(()=>result.current.actions.loadInvitations());
    expect(result.current.state.error).toBe("Home offline");
  });
  it("removes a confirmed decline even when refreshing the inbox fails",async()=>{
    api.get.mockResolvedValueOnce({data:{result:[{id:"invite",projectId:"project"}]}});
    const {result}=setup();await act(()=>result.current.actions.loadInvitations());
    api.post.mockResolvedValue({data:{result:null}});api.get.mockRejectedValue(new Error("offline"));
    await act(()=>result.current.actions.declineInvite("project","invite"));
    expect(result.current.state.invitations).toEqual([]);
  });
  it("loads the signed-in user's inbox and propagates a load failure",async()=>{
    const invite={id:"invite",projectId:"project",projectTitle:"Notebook",estimatedHoursPerWeek:4};
    api.get.mockResolvedValue({data:{result:[invite]}});
    const {result}=setup();await act(()=>result.current.actions.loadInvitations());
    expect(result.current.state.invitations).toEqual([invite]);
    expect(api.get).toHaveBeenCalledWith("/api/services/app/BuildJourney/GetMyInvitations");
    api.get.mockRejectedValue(new Error("offline"));
    await act(async()=>{await expect(result.current.actions.loadInvitations()).rejects.toThrow("offline");});
    expect(result.current.state.invitations).toEqual([invite]);
  });
  it("sends only the selected developer and reports failed sends",async()=>{
    api.post.mockResolvedValue({data:{result:null}});const {result}=setup();
    await act(()=>result.current.actions.inviteMember("project","teammate"));
    expect(api.post).toHaveBeenCalledWith("/api/services/app/BuildJourney/InviteMember",{projectId:"project",userName:"teammate"});
    api.post.mockRejectedValue(new Error("Team full"));
    await act(async()=>{await expect(result.current.actions.inviteMember("project","teammate")).rejects.toThrow("Team full");});
  });
  it("refreshes the inbox after declining and preserves it if the write fails",async()=>{
    api.get.mockResolvedValue({data:{result:[]}});api.post.mockResolvedValue({data:{result:null}});
    const {result}=setup();await act(()=>result.current.actions.declineInvite("project","invite"));
    expect(api.post).toHaveBeenCalledWith("/api/services/app/DeveloperProject/RejectProjectInvite",{projectId:"project",inviteId:"invite"});
    expect(result.current.state.invitations).toEqual([]);
    api.post.mockRejectedValue(new Error("Expired"));
    await act(async()=>{await expect(result.current.actions.declineInvite("project","invite")).rejects.toThrow("Expired");});
  });
});
