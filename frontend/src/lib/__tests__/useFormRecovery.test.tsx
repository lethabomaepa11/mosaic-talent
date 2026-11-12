import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { useFormRecovery } from "../useFormRecovery";
import { writeFormDraft } from "../formDraft";
beforeEach(()=>sessionStorage.clear());afterEach(cleanup);
it("restores typed fields, ignores malformed field types and separates users",()=>{
  writeFormDraft("user-1.project",{title:"Saved",starter:false,summary:17});
  const {result,rerender}=renderHook(({key})=>useFormRecovery(key,{title:"Initial",summary:"",starter:true}),{initialProps:{key:"user-1.project"}});
  expect(result.current.values).toEqual({title:"Saved",summary:"",starter:false});
  expect(result.current.restored).toBe(true);
  act(()=>result.current.update({summary:"My contribution"}));
  expect(result.current.values.summary).toBe("My contribution");
  rerender({key:"user-2.project"});expect(result.current.values).toEqual({title:"Initial",summary:"",starter:true});
  rerender({key:"user-1.project"});expect(result.current.values.summary).toBe("My contribution");
  act(()=>result.current.clear());expect(result.current.values.title).toBe("Initial");
  expect(sessionStorage.getItem("mosaic.talent.form.user-1.project")).toBeNull();
});
