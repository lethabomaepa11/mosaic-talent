import {expect,test} from "@playwright/test";
import {setupBuildJourney,teamBuilds} from "./build-journey-fixture";
import {jsonOk} from "./project-create-fixture";
test("explains team fit and preserves an explicit join decision when joining fails",async({page})=>{
  await setupBuildJourney(page);await page.goto("/app/projects/open");
  const first=page.getByTestId("build-card").first();await expect(first.getByText("React Dashboard")).toBeVisible();await first.getByText("Matches your preferences",{exact:true}).click();await expect(first.getByText("Practice React")).toBeVisible();await expect(first.getByText("Fits your 4h weekly availability")).toBeVisible();
  await page.route("**/api/services/app/BuildJourney/GetBuild*",route=>route.fulfill(jsonOk({...teamBuilds[0],currentDeveloperId:"dev-99",isMember:false})));
  await page.route("**/api/services/app/DeveloperProject/GetJoinProjectLoadWarning*",route=>route.fulfill(jsonOk({shouldWarn:true,message:"Check your existing commitments."})));
  await page.route("**/api/services/app/DeveloperProject/JoinProject",route=>route.fulfill({status:400,contentType:"application/json",body:JSON.stringify({error:{message:"Team could not be joined. Try again."}})}));
  await first.getByRole("link",{name:"View project"}).click();await page.getByRole("button",{name:"Join project",exact:true}).click();const dialog=page.getByRole("dialog");await expect(dialog.getByRole("button",{name:"Join project",exact:true})).toBeDisabled();await dialog.getByRole("checkbox").check();await dialog.getByRole("button",{name:"Join project",exact:true}).click();await expect(dialog.getByText("Check your existing commitments.")).toBeVisible();await dialog.getByRole("button",{name:"Confirm and join"}).click();await expect(dialog.getByText("Team could not be joined. Try again.")).toBeVisible();await expect(dialog.getByRole("checkbox")).toBeChecked();
});
