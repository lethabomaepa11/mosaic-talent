import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { privatePaths, publicMetadata, siteOrigin } from "../seo";

describe("public search metadata", () => {
  it("keeps the home name exact and gives public pages distinct canonicals", () => {
    const home = publicMetadata("/", "mosaic.talent");
    const guide = publicMetadata("/how-to", "Getting started", "How to build together");
    expect(home.title).toEqual({absolute:"mosaic.talent"});
    expect(home.alternates?.canonical).toBe("/");
    expect(guide.alternates?.canonical).toBe("/how-to");
    expect(guide.title).toEqual({absolute:"Getting started | mosaic.talent"});
    expect(guide.openGraph).toMatchObject({url:"/how-to",description:"How to build together",siteName:"mosaic.talent"});
    expect(guide.twitter).toMatchObject({card:"summary_large_image"});
  });
  it("lists only public editorial pages without inventing modification dates", () => {
    expect(sitemap()).toEqual([{url:`${siteOrigin}/`},{url:`${siteOrigin}/how-to`}]);
    expect(sitemap().some(entry => /app|login|signup/.test(new URL(entry.url).pathname))).toBe(false);
  });
  it("points crawlers at the sitemap and excludes account/workspace routes", () => {
    expect(robots()).toMatchObject({rules:{userAgent:"*",allow:"/",disallow:privatePaths},sitemap:`${siteOrigin}/sitemap.xml`});
    expect(privatePaths).toContain("/app");expect(privatePaths).toContain("/onboarding");
  });
});
