import {expect,test} from "@playwright/test";
for(const width of [360,768,1280]){
 test(`landing explains the product and exposes signup at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:800});await page.goto("/");
  await expect(page.getByRole("heading",{name:"Build a project with other developers."})).toBeVisible();
  const signup=page.getByRole("link",{name:"Create account",exact:true}).first();
  await expect(signup).toHaveAttribute("href","/signup");await expect(signup).toBeInViewport();
  await expect(page.getByText(/Connecting GitHub is optional/)).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(width===360){await signup.click();await expect(page).toHaveURL(/\/signup$/);await expect(page.getByRole("button",{name:"Create account",exact:true})).toBeVisible();}
 });
}
