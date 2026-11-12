import {expect,test} from "@playwright/test";
import {setupBuildJourney} from "./build-journey-fixture";
test("finds teams by real problem, skill, purpose and a sustainable commitment",async({page})=>{
  await setupBuildJourney(page);await page.goto("/app/projects/open");
  await expect(page.getByRole("heading",{name:"Find a project"})).toBeVisible();
  await expect(page.getByText("React Dashboard")).toBeVisible();await expect(page.getByText("Python API")).toBeVisible();
  const search=page.getByRole("textbox",{name:"Search projects"});
  for(const query of ["TypeScript","community clinics"]){await search.fill(query);await expect(page.getByText("React Dashboard")).toBeVisible();await expect(page.getByText("Python API")).toHaveCount(0);}
  await search.clear();await page.getByRole("combobox",{name:"Project goal"}).click();await page.getByText("Explore a cofounder",{exact:true}).last().click();await expect(page.getByText("Python API")).toBeVisible();await expect(page.getByText("React Dashboard")).toHaveCount(0);
  await page.getByRole("combobox",{name:"Project goal"}).click();await page.getByText("Learn with a team",{exact:true}).last().click();await page.getByRole("combobox",{name:"Weekly commitment"}).click();await page.getByText("Up to 4h / week",{exact:true}).click();await expect(page.getByText("Python API")).toHaveCount(0);
  await page.getByRole("heading",{name:"Find a project"}).click();
  await expect(page.locator(".ant-select-dropdown:visible")).toHaveCount(0);
  for(const width of [360,768,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,elements:[...document.querySelectorAll("body *")].filter(element=>element.getBoundingClientRect().right>innerWidth+1).slice(0,5).map(element=>element.className)}))).toMatchObject({overflow:false});}
  await search.fill("no such problem");await expect(page.getByText("No projects match these filters.")).toBeVisible();await page.getByRole("button",{name:"Clear filters"}).click();await expect(page.getByText("Python API")).toBeVisible();
});
