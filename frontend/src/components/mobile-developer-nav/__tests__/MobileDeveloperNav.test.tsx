import {render,screen} from "@testing-library/react";
import {describe,it,expect,vi} from "vitest";
import {MobileDeveloperNav} from "../MobileDeveloperNav";
vi.mock("next/navigation",()=>({usePathname:()=>"/app/ideator"}));
describe("Mobile navigation",()=>{
 it("exposes the four primary destinations and marks the active page",()=>{
  render(<MobileDeveloperNav/>);
  for(const [name,href] of [["Home","/app"],["Explore","/app/projects/open"],["Ideas","/app/ideator"],["Projects","/app/work"]]) expect(screen.getByRole("link",{name,hidden:true})).toHaveAttribute("href",href);
  expect(screen.getByRole("link",{name:"Ideas",hidden:true})).toHaveAttribute("aria-current","page");
 });
});
