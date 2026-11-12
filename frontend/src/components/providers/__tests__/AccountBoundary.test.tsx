import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AccountBoundary } from "../AccountBoundary";
const identity=vi.hoisted(()=>({userId:1,tenant:""}));
vi.mock("@/providers/auth-provider",()=>({useAuthState:()=>({user:{userId:identity.userId}})}));
vi.mock("@/providers/tenant-provider",()=>({useTenantResolutionState:()=>({tenancyName:identity.tenant})}));
const Cache=()=>{const [value,setValue]=useState("");return <input aria-label="Cached work" value={value} onChange={event=>setValue(event.target.value)}/>;};
afterEach(cleanup);
it("clears workspace caches across accounts and tenants, while retaining them for the same account",()=>{
  const {rerender}=render(<AccountBoundary><Cache/></AccountBoundary>);
  fireEvent.change(screen.getByLabelText("Cached work"),{target:{value:"Private project"}});
  rerender(<AccountBoundary><Cache/></AccountBoundary>);expect(screen.getByLabelText("Cached work")).toHaveValue("Private project");
  identity.userId=2;rerender(<AccountBoundary><Cache/></AccountBoundary>);expect(screen.getByLabelText("Cached work")).toHaveValue("");
  fireEvent.change(screen.getByLabelText("Cached work"),{target:{value:"Company work"}});
  identity.tenant="another-company";rerender(<AccountBoundary><Cache/></AccountBoundary>);expect(screen.getByLabelText("Cached work")).toHaveValue("");
});
