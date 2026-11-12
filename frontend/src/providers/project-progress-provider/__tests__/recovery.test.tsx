import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectProgressProvider, useProjectProgressAction, useProjectProgressState } from "..";
const api=vi.hoisted(()=>({get:vi.fn(),post:vi.fn()}));
vi.mock("@/utils/axiosInstance",()=>({getAxiosInstance:()=>api}));
const entry={id:"entry",projectId:"project",developerId:"developer",title:"Note",summary:"Useful work",evidenceUrl:"https://example.com/pr/1",selfReview:"Learned teamwork",reviews:[]};
const setup=()=>renderHook(()=>({actions:useProjectProgressAction(),state:useProjectProgressState()}),{wrapper:ProjectProgressProvider});
beforeEach(()=>vi.resetAllMocks());afterEach(cleanup);
describe("confirmed progress writes",()=>{
  it("keeps a successful write when the subsequent refresh fails",async()=>{
    api.post.mockResolvedValue({data:{result:entry}});api.get.mockRejectedValue(new Error("offline"));
    const {result}=setup();await act(()=>result.current.actions.createEntry(entry));
    expect(result.current.state.entries[0]).toMatchObject(entry);
    expect(result.current.state.isSuccess).toBe(true);
    expect(api.post).toHaveBeenCalledTimes(1);
  });
  it("keeps confirmed review changes when refreshing fails",async()=>{
    api.post.mockResolvedValue({data:{result:{...entry,reviews:[{id:"review",comment:"Good work"}]}}});
    api.get.mockRejectedValue(new Error("offline"));const {result}=setup();
    await act(()=>result.current.actions.reviewEntry("entry","Good work"));
    expect(result.current.state.entries[0].reviews[0].comment).toBe("Good work");
  });
  it("reports an unsuccessful write so the form can retain its draft",async()=>{
    api.post.mockRejectedValue(new Error("Not saved"));const {result}=setup();
    await act(async()=>{await expect(result.current.actions.createEntry(entry)).rejects.toThrow("Not saved");});
    expect(result.current.state.isError).toBe(true);expect(result.current.state.entries).toEqual([]);
  });
});
